from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage
from passlib.context import CryptContext
from jose import JWTError, jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Load JSON data
with open(ROOT_DIR / 'data_courses.json', 'r') as f:
    COURSES_DATA = json.load(f)

with open(ROOT_DIR / 'data_jobs.json', 'r') as f:
    JOBS_DATA = json.load(f)

with open(ROOT_DIR / 'data_skills.json', 'r') as f:
    SKILLS_DATA = json.load(f)

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class UserProfile(BaseModel):
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    skills: List[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CareerRecommendationRequest(BaseModel):
    marks_10th: float
    marks_12th: float
    gpa: float
    backlogs: int
    domain: str
    budget: float
    time_availability: str
    future_goals: str

class MessageRequest(BaseModel):
    message: str
    session_id: str
    context: Optional[Dict[str, Any]] = None

class CommunityPost(BaseModel):
    post_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    type: str  # question, guide, resource
    author: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MentorRequest(BaseModel):
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    domain: str
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# JIGYASA - Explore Careers & Colleges
@api_router.get("/jigyasa/colleges")
async def get_colleges(search: Optional[str] = None, mode: Optional[str] = None):
    filtered = COURSES_DATA
    if search:
        filtered = [c for c in filtered if search.lower() in c.get('course_name', '').lower() or search.lower() in c.get('institution', '').lower()]
    if mode:
        filtered = [c for c in filtered if c.get('mode', '').lower() == mode.lower()]
    return {"colleges": filtered, "total": len(filtered)}

@api_router.get("/jigyasa/colleges/{course_id}")
async def get_college_detail(course_id: int):
    college = next((c for c in COURSES_DATA if c['course_id'] == course_id), None)
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    return college

@api_router.get("/jigyasa/skills")
async def get_skills(category: Optional[str] = None, difficulty: Optional[str] = None):
    filtered = SKILLS_DATA
    if category:
        filtered = [s for s in filtered if s.get('category', '').lower() == category.lower()]
    if difficulty:
        filtered = [s for s in filtered if s.get('difficulty_level', '').lower() == difficulty.lower()]
    return {"skills": filtered, "total": len(filtered)}

@api_router.get("/jigyasa/skills/{skill_id}")
async def get_skill_detail(skill_id: int):
    skill = next((s for s in SKILLS_DATA if s['skill_id'] == skill_id), None)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill

@api_router.get("/jigyasa/jobs")
async def get_jobs(category: Optional[str] = None, city: Optional[str] = None, demand: Optional[str] = None):
    filtered = JOBS_DATA
    if category:
        filtered = [j for j in filtered if j.get('category', '').lower() == category.lower()]
    if city:
        filtered = [j for j in filtered if city in j.get('city', [])]
    if demand:
        filtered = [j for j in filtered if j.get('demand_level', '').lower() == demand.lower()]
    return {"jobs": filtered, "total": len(filtered)}

@api_router.get("/jigyasa/jobs/{job_id}")
async def get_job_detail(job_id: int):
    job = next((j for j in JOBS_DATA if j['job_id'] == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

# MARGADARSHAK - AI Career Path Generator
@api_router.post("/margadarshak/recommend")
async def generate_career_recommendation(req: CareerRecommendationRequest):
    # Calculate Academic Score
    if req.marks_12th >= 80:
        academic_score = 10
    elif req.marks_12th >= 60:
        academic_score = 7
    elif req.marks_12th >= 40:
        academic_score = 4
    else:
        academic_score = 2
    
    # Adjust for GPA and backlogs
    if req.gpa >= 8:
        academic_score += 2
    elif req.gpa >= 6:
        academic_score += 1
    
    if req.backlogs > 3:
        academic_score -= 2
    elif req.backlogs > 0:
        academic_score -= 1
    
    academic_score = max(0, min(10, academic_score))
    
    # Calculate scores for each job
    scored_careers = []
    for job in JOBS_DATA:
        # Interest Alignment (domain match)
        interest_score = 8 if req.domain.lower() in job.get('category', '').lower() else 3
        
        # Market Demand
        demand_map = {'High': 10, 'Medium': 6, 'Low-Medium': 4, 'Low': 2}
        market_demand = demand_map.get(job.get('demand_level', 'Medium'), 5)
        
        # Skill Match (basic heuristic)
        skill_match = 5  # Default mid-range
        
        # Calculate final score
        career_score = (academic_score * 0.25) + (interest_score * 0.35) + (skill_match * 0.30) + (market_demand * 0.10)
        
        scored_careers.append({
            "job": job,
            "score": career_score,
            "match_percentage": min(100, int(career_score * 10))
        })
    
    # Sort and get top 3
    scored_careers.sort(key=lambda x: x['score'], reverse=True)
    top_careers = scored_careers[:3]
    
    return {
        "academic_score": academic_score,
        "recommendations": top_careers,
        "total_analyzed": len(scored_careers)
    }

@api_router.post("/margadarshak/roadmap")
async def generate_roadmap(req: CareerRecommendationRequest):
    # Find matching job
    matching_job = next((j for j in JOBS_DATA if req.domain.lower() in j.get('category', '').lower()), JOBS_DATA[0])
    
    # Find relevant courses and skills
    required_skills = matching_job.get('skills_required', [])
    relevant_courses = [c for c in COURSES_DATA if any(skill in c.get('skills_covered', []) for skill in required_skills)]
    
    # Build 3-level roadmap
    roadmap = {
        "career": matching_job['job_title'],
        "total_duration_months": 12,
        "levels": [
            {
                "level": "Beginner",
                "duration_weeks": 8,
                "skills": required_skills[:2] if len(required_skills) >= 2 else required_skills,
                "courses": [c['course_name'] for c in relevant_courses[:2]],
                "projects": [f"Basic {matching_job['job_title']} project", "Portfolio setup"],
                "certifications": [c['course_name'] for c in relevant_courses[:1] if c.get('type') == 'Certificate']
            },
            {
                "level": "Intermediate",
                "duration_weeks": 12,
                "skills": required_skills[2:4] if len(required_skills) >= 4 else required_skills,
                "courses": [c['course_name'] for c in relevant_courses[2:4]],
                "projects": [f"Real-world {matching_job['job_title']} application", "Industry-standard project"],
                "certifications": [c['course_name'] for c in relevant_courses[1:2] if c.get('type') == 'Certificate']
            },
            {
                "level": "Advanced",
                "duration_weeks": 16,
                "skills": required_skills[4:] if len(required_skills) > 4 else ["Advanced specialization"],
                "courses": [c['course_name'] for c in relevant_courses[4:6]],
                "projects": [f"Capstone {matching_job['job_title']} project", "Open-source contribution"],
                "certifications": [c['course_name'] for c in relevant_courses[2:3] if c.get('type') == 'Certification']
            }
        ]
    }
    
    return roadmap

@api_router.post("/margadarshak/chat")
async def margadarshak_chat(req: MessageRequest):
    try:
        system_message = f"""You are MARGADARSHAK, an AI career counselor for the Sankalp platform. 
Your role is to help students with career guidance based on their academic background and interests.

You have access to data about:
- {len(JOBS_DATA)} job roles with salary, skills, and demand information
- {len(COURSES_DATA)} courses and certifications
- {len(SKILLS_DATA)} skills with learning paths

Provide personalized, actionable career advice. Be encouraging and specific.
When suggesting careers, mention realistic timelines and required skills."""
        
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=req.session_id,
            system_message=system_message
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=req.message)
        response = await chat.send_message(user_message)
        
        # Store chat in database
        chat_doc = {
            "session_id": req.session_id,
            "user_message": req.message,
            "ai_response": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.margadarshak_chats.insert_one(chat_doc)
        
        return {"response": response, "session_id": req.session_id}
    except Exception as e:
        logging.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat service error: {str(e)}")

# SAMARTHYA - Skills-to-Jobs Mapping
@api_router.post("/samarthya/profile")
async def create_profile(profile: UserProfile):
    profile_dict = profile.model_dump()
    profile_dict['created_at'] = profile_dict['created_at'].isoformat()
    await db.user_profiles.insert_one(profile_dict)
    return {"message": "Profile created", "user_id": profile.user_id}

@api_router.post("/samarthya/match")
async def match_skills_to_jobs(user_skills: List[str]):
    matched_jobs = []
    
    for job in JOBS_DATA:
        required_skills = set(job.get('skills_required', []))
        user_skill_set = set(user_skills)
        
        matching_skills = required_skills.intersection(user_skill_set)
        missing_skills = required_skills - user_skill_set
        
        match_percentage = (len(matching_skills) / len(required_skills) * 100) if required_skills else 0
        
        if match_percentage > 0:
            matched_jobs.append({
                "job": job,
                "match_percentage": round(match_percentage, 1),
                "matching_skills": list(matching_skills),
                "missing_skills": list(missing_skills),
                "skill_gap_count": len(missing_skills)
            })
    
    matched_jobs.sort(key=lambda x: x['match_percentage'], reverse=True)
    
    return {
        "total_matches": len(matched_jobs),
        "matches": matched_jobs[:10],
        "user_skills": user_skills
    }

# DRISHTIKON - Career Insights Dashboard
@api_router.get("/drishtikon/insights")
async def get_career_insights():
    # Trending domains
    domain_count = {}
    for job in JOBS_DATA:
        category = job.get('category', 'Other')
        domain_count[category] = domain_count.get(category, 0) + 1
    
    # Salary analysis
    salaries = [j.get('avg_salary', 0) for j in JOBS_DATA]
    avg_salary = sum(salaries) / len(salaries) if salaries else 0
    
    # Demand analysis
    high_demand_jobs = [j for j in JOBS_DATA if j.get('demand_level') == 'High']
    
    # Top emerging skills
    all_skills = []
    for job in JOBS_DATA:
        all_skills.extend(job.get('skills_required', []))
    
    from collections import Counter
    skill_counts = Counter(all_skills)
    top_skills = skill_counts.most_common(10)
    
    return {
        "trending_domains": [
            {"domain": k, "job_count": v} for k, v in sorted(domain_count.items(), key=lambda x: x[1], reverse=True)
        ],
        "salary_insights": {
            "average": round(avg_salary),
            "highest": max(salaries) if salaries else 0,
            "lowest": min(salaries) if salaries else 0
        },
        "high_demand_count": len(high_demand_jobs),
        "top_emerging_skills": [{"skill": skill, "demand": count} for skill, count in top_skills],
        "total_jobs_analyzed": len(JOBS_DATA)
    }

@api_router.get("/drishtikon/salary-trends")
async def get_salary_trends():
    salary_by_category = {}
    for job in JOBS_DATA:
        category = job.get('category', 'Other')
        if category not in salary_by_category:
            salary_by_category[category] = []
        salary_by_category[category].append(job.get('avg_salary', 0))
    
    trends = []
    for category, salaries in salary_by_category.items():
        avg = sum(salaries) / len(salaries) if salaries else 0
        trends.append({
            "category": category,
            "average_salary": round(avg),
            "job_count": len(salaries)
        })
    
    trends.sort(key=lambda x: x['average_salary'], reverse=True)
    return {"salary_trends": trends}

# SAHYOG - Community Support
@api_router.get("/sahyog/posts")
async def get_community_posts(type: Optional[str] = None):
    query = {}
    if type:
        query['type'] = type
    posts = await db.community_posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    for post in posts:
        if isinstance(post.get('created_at'), str):
            post['created_at'] = post['created_at']
    return {"posts": posts, "total": len(posts)}

@api_router.post("/sahyog/posts")
async def create_community_post(post: CommunityPost):
    post_dict = post.model_dump()
    post_dict['created_at'] = post_dict['created_at'].isoformat()
    await db.community_posts.insert_one(post_dict)
    return {"message": "Post created", "post_id": post.post_id}

@api_router.post("/sahyog/mentor-request")
async def create_mentor_request(request: MentorRequest):
    request_dict = request.model_dump()
    request_dict['created_at'] = request_dict['created_at'].isoformat()
    await db.mentor_requests.insert_one(request_dict)
    return {"message": "Mentor request submitted", "request_id": request.request_id}

@api_router.get("/sahyog/resources")
async def get_resources():
    resources = [
        {"title": "Getting Started with Career Planning", "type": "guide", "url": "#"},
        {"title": "Resume Writing Tips", "type": "guide", "url": "#"},
        {"title": "Interview Preparation Checklist", "type": "resource", "url": "#"},
        {"title": "Top Free Learning Platforms", "type": "resource", "url": "#"},
    ]
    return {"resources": resources}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()