from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Cookie, Header, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from starlette.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys
import logging
from collections import Counter
import json
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
try:
    from google import genai
    from google.genai import types
    HAS_GOOGLE_GENAI = True
except ImportError:
    HAS_GOOGLE_GENAI = False
from passlib.context import CryptContext
from jose import JWTError, jwt
import bcrypt

ROOT_DIR = Path(__file__).parent.resolve()
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Internal modular imports
from models import (
    JobModel, SkillModel, CourseModel, CollegeModel, InterestMappingModel,
    MarketInsightsModel, DataSourceModel, SyncRunModel, AuditLogModel, utc_now
)
from db import (
    get_mongo_client, get_db, init_db_indexes, cache,
    fetch_jobs_from_db, fetch_skills_from_db, fetch_courses_from_db,
    fetch_colleges_from_db, fetch_interest_mappings_from_db
)
from scoring import (
    evaluate_career_recommendations, generate_four_stage_roadmap,
    calculate_academic_eligibility
)
from ingestion import IngestionPipeline, CuratedPublicFeedAdapter, ManualUploadAdapter
from migration import run_data_migration
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("sankalp.server")

# MongoDB connection initialization
client = get_mongo_client()
db = get_db()

def check_db():
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="Database connection is not configured. Please set MONGO_URL in environment variables."
        )

# Create the main app
app = FastAPI(title="Sankalp Platform API", version="2.0.0")

cors_origins_env = os.getenv("CORS_ORIGINS", "")
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
if not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# JWT settings
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "sankalp-production-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            return False

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    authorization: Optional[str] = Cookie(None, alias="sankalp_token"),
    auth_header: Optional[str] = Header(None, alias="Authorization")
):
    token = authorization
    if not token and auth_header:
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
        else:
            token = auth_header.strip()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_admin(
    authorization: Optional[str] = Cookie(None, alias="sankalp_admin_token"),
    auth_header: Optional[str] = Header(None, alias="Authorization")
):
    token = authorization
    if not token and auth_header:
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
        else:
            token = auth_header.strip()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        is_admin: bool = payload.get("is_admin", False)
        admin_email: str = payload.get("email")
        if not is_admin or admin_email != "Admin123@gmail.com":
            raise HTTPException(status_code=403, detail="Admin access required")
        return admin_email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Request Models
class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    phone_no: str
    password: str
    confirm_password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    name: str
    email: str
    phone_no: str
    created_at: datetime

class ProgressItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    type: str  # roadmap, course, project, custom_goal, skill
    status: str  # not_started, in_progress, completed
    percent_complete: float = 0.0
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    description: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

class CreateGoalRequest(BaseModel):
    title: str
    description: str
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None

class UpdateProgressRequest(BaseModel):
    item_id: str
    status: Optional[str] = None
    percent_complete: Optional[float] = None

class ImportRoadmapRequest(BaseModel):
    roadmap: Dict[str, Any]

class UserProfile(BaseModel):
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    skills: List[str]
    created_at: datetime = Field(default_factory=utc_now)

class CareerRecommendationRequest(BaseModel):
    marks_10th: float
    marks_12th: float
    gpa: float
    backlogs: int
    domain: str
    budget: Optional[float] = None
    time_availability: Optional[str] = None
    future_goals: Optional[str] = None
    skills: Optional[List[str]] = None
    city: Optional[str] = None

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
    created_at: datetime = Field(default_factory=utc_now)

class MentorRequest(BaseModel):
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    domain: str
    message: str
    created_at: datetime = Field(default_factory=utc_now)

class StatusUpdateRequest(BaseModel):
    status: str  # published, draft, pending_review, archived

class TriggerSyncRequest(BaseModel):
    source_id: Optional[str] = "curated_public_feed"
    payload: Optional[Dict[str, List[Dict[str, Any]]]] = None


# ============= HEALTH CHECK =============

@api_router.get("/health")
async def health_check():
    db_connected = False
    db_err = None
    counts = {}
    if db is not None:
        try:
            await db.command("ping")
            db_connected = True
            counts = {
                "jobs": await db.jobs.count_documents({}),
                "skills": await db.skills.count_documents({}),
                "courses": await db.courses.count_documents({}),
                "colleges": await db.colleges.count_documents({}),
                "users": await db.users.count_documents({})
            }
        except Exception as e:
            db_err = str(e)
            
    return {
        "status": "ok",
        "gemini_configured": bool(os.environ.get("GEMINI_API_KEY")),
        "mongo_configured": bool(os.environ.get("MONGO_URL") or os.environ.get("LOCAL_DEV")),
        "database_connected": db_connected,
        "database_name": os.environ.get("DB_NAME", "sankalp"),
        "database_counts": counts,
        "database_error": db_err
    }


# ============= USER AUTHENTICATION =============
@api_router.post("/auth/signup")
async def signup(user_data: SignupRequest, response: Response):
    check_db()
    if user_data.password != user_data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    if len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "phone_no": user_data.phone_no,
        "password_hash": hashed_password,
        "created_at": utc_now().isoformat()
    }
    await db.users.insert_one(user_doc)
    
    access_token = create_access_token(data={"sub": user_id, "email": user_data.email})
    response.set_cookie(
        key="sankalp_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=True
    )
    
    return {
        "message": "User registered successfully",
        "user": {"id": user_id, "name": user_data.name, "email": user_data.email, "phone_no": user_data.phone_no},
        "token": access_token
    }

@api_router.post("/auth/login")
async def login(login_data: LoginRequest, response: Response):
    check_db()
    user = await db.users.find_one({"email": login_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user["id"], "email": user["email"]})
    response.set_cookie(
        key="sankalp_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=True
    )
    
    return {
        "message": "Login successful",
        "user": {"id": user["id"], "name": user["name"], "email": user["email"], "phone_no": user["phone_no"]},
        "token": access_token
    }

@api_router.get("/auth/me")
async def get_me(user_id: str = Depends(get_current_user)):
    check_db()
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": user}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="sankalp_token", samesite="lax", secure=True)
    return {"message": "Logged out successfully"}


# ============= ADMIN AUTHENTICATION =============
@api_router.post("/admin/login")
async def admin_login(login_data: AdminLoginRequest, response: Response):
    ADMIN_EMAIL = "Admin123@gmail.com"
    ADMIN_PASSWORD = "Admin123"
    
    if login_data.email != ADMIN_EMAIL or login_data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    access_token = create_access_token(data={
        "sub": "admin",
        "email": ADMIN_EMAIL,
        "is_admin": True
    })
    
    response.set_cookie(
        key="sankalp_admin_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=True
    )
    
    return {
        "message": "Admin login successful",
        "admin": {"email": ADMIN_EMAIL},
        "token": access_token
    }

@api_router.get("/admin/me")
async def get_admin(admin_email: str = Depends(get_current_admin)):
    return {"admin": {"email": admin_email, "role": "admin"}}

@api_router.post("/admin/logout")
async def admin_logout(response: Response):
    response.delete_cookie(key="sankalp_admin_token", samesite="lax", secure=True)
    return {"message": "Admin logged out successfully"}


# ============= JIGYASA (EXPLORE CAREERS, SKILLS & COLLEGES) =============
@api_router.get("/jigyasa/colleges")
async def get_colleges(search: Optional[str] = None, mode: Optional[str] = None):
    colleges = await fetch_colleges_from_db(include_unpublished=False)
    filtered = colleges
    if search:
        s_low = search.lower()
        filtered = [
            c for c in filtered 
            if s_low in c.get('program_name', c.get('course_name', '')).lower() 
            or s_low in c.get('institution', c.get('college_name', '')).lower()
        ]
    if mode:
        m_low = mode.lower()
        filtered = [c for c in filtered if c.get('mode', '').lower() == m_low]
    
    # Backwards-compatible course_id / course_name mapping
    normalized = []
    for c in filtered:
        item = dict(c)
        if "course_id" not in item and "college_id" in item:
            item["course_id"] = item["college_id"]
        if "course_name" not in item and "program_name" in item:
            item["course_name"] = item["program_name"]
        normalized.append(item)

    return {"colleges": normalized, "total": len(normalized)}

@api_router.get("/jigyasa/colleges/{course_id}")
async def get_college_detail(course_id: int):
    colleges = await fetch_colleges_from_db(include_unpublished=False)
    college = next((c for c in colleges if c.get('college_id') == course_id or c.get('course_id') == course_id), None)
    if not college:
        # Check courses
        courses = await fetch_courses_from_db(include_unpublished=False)
        college = next((c for c in courses if c.get('course_id') == course_id), None)
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    return college

@api_router.get("/jigyasa/skills")
async def get_skills(category: Optional[str] = None, difficulty: Optional[str] = None):
    skills = await fetch_skills_from_db(include_unpublished=False)
    filtered = skills
    if category:
        filtered = [s for s in filtered if s.get('category', '').lower() == category.lower()]
    if difficulty:
        filtered = [s for s in filtered if s.get('difficulty_level', '').lower() == difficulty.lower()]
    return {"skills": filtered, "total": len(filtered)}

@api_router.get("/jigyasa/skills/{skill_id}")
async def get_skill_detail(skill_id: int):
    skills = await fetch_skills_from_db(include_unpublished=False)
    skill = next((s for s in skills if s.get('skill_id') == skill_id), None)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill

@api_router.get("/jigyasa/jobs")
async def get_jobs(category: Optional[str] = None, city: Optional[str] = None, demand: Optional[str] = None):
    jobs = await fetch_jobs_from_db(include_unpublished=False)
    filtered = jobs
    if category:
        filtered = [j for j in filtered if j.get('category', '').lower() == category.lower()]
    if city:
        filtered = [j for j in filtered if any(city.lower() in c.lower() for c in j.get('city', []))]
    if demand:
        filtered = [j for j in filtered if j.get('demand_level', '').lower() == demand.lower()]
    return {"jobs": filtered, "total": len(filtered)}

@api_router.get("/jigyasa/jobs/{job_id}")
async def get_job_detail(job_id: int):
    jobs = await fetch_jobs_from_db(include_unpublished=False)
    job = next((j for j in jobs if j.get('job_id') == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


# ============= MARGADARSHAK (DETERMINISTIC CAREER SCORING & 4-STAGE ROADMAP) =============
@api_router.post("/margadarshak/recommend")
async def generate_career_recommendation(req: CareerRecommendationRequest):
    return await evaluate_career_recommendations(
        marks_10th=req.marks_10th,
        marks_12th=req.marks_12th,
        gpa=req.gpa,
        backlogs=req.backlogs,
        domain=req.domain,
        user_skills=req.skills,
        preferred_city=req.city
    )

@api_router.post("/margadarshak/roadmap")
async def generate_roadmap(req: CareerRecommendationRequest):
    return await generate_four_stage_roadmap(domain=req.domain)

async def call_gemini_api(user_message: str, system_instruction: str) -> Optional[str]:
    """Call Google Gemini API via official SDK or direct HTTP REST API."""
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        return None

    if HAS_GOOGLE_GENAI:
        try:
            client = genai.Client(api_key=gemini_key)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=user_message,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.7,
                )
            )
            if response and response.text:
                return response.text
        except Exception as sdk_err:
            logger.warning(f"google-genai SDK error: {sdk_err}, trying REST fallback...")

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
        payload = {
            "system_instruction": {"parts": [{"text": system_instruction}]},
            "contents": [{"parts": [{"text": user_message}]}]
        }
        async with httpx.AsyncClient(timeout=15.0) as http_client:
            resp = await http_client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"]
            else:
                logger.warning(f"Gemini HTTP returned status {resp.status_code}: {resp.text[:200]}")
    except Exception as http_err:
        logger.warning(f"Gemini HTTP request error: {http_err}")

    return None

async def generate_margadarshak_fallback_response(user_message: str) -> str:
    """Intelligent fallback querying MongoDB jobs and courses when Gemini API is unavailable."""
    msg = user_message.lower()
    jobs = await fetch_jobs_from_db(include_unpublished=False)
    courses = await fetch_courses_from_db(include_unpublished=False)

    matched_job = None
    for j in jobs:
        title = j.get("job_title", "").lower()
        cat = j.get("category", "").lower()
        if any(term in msg for term in [title, cat]):
            matched_job = j
            break

    if not matched_job:
        matched_job = jobs[0] if jobs else {
            "job_title": "Data Analyst",
            "category": "Data Science / Analytics",
            "demand_level": "High",
            "avg_salary": 600000,
            "skills_required": ["SQL", "Python", "Data Visualization"]
        }

    domain = matched_job.get("category", "Technology & Data")
    role = matched_job.get("job_title", "Professional")
    skills = matched_job.get("skills_required", ["Python", "SQL", "Problem Solving"])
    skills_s1 = ", ".join(skills[:2]) if len(skills) >= 2 else skills[0]
    skills_s2 = ", ".join(skills[2:4]) if len(skills) >= 4 else (skills[1] if len(skills) > 1 else "Core tools")
    
    rel_courses = [c for c in courses if any(s in c.get('skills_covered', []) for s in skills)]
    if not rel_courses:
        rel_courses = courses[:2]
    c1 = f"{rel_courses[0]['course_name']} ({rel_courses[0]['institution']})" if len(rel_courses) > 0 else "Foundational Certification"
    c2 = f"{rel_courses[1]['course_name']} ({rel_courses[1]['institution']})" if len(rel_courses) > 1 else "Advanced Bootcamp"

    rel_jobs = [j['job_title'] for j in jobs if j.get('category') == domain][:3]
    if not rel_jobs:
        rel_jobs = [role]
    paths_str = "\n".join([f"• {rj}" for rj in rel_jobs])

    return f"""**Recommended Domain:** {domain}

**Why:** High market demand ({matched_job.get('demand_level', 'High')} demand), competitive salary (~₹{matched_job.get('avg_salary', 600000)/100000:.1f}L/yr), and strong career progression opportunities.

**Quick 4-Stage Roadmap:**
• **Stage 1: Foundation (2 months):** Core foundations in {skills_s1}
• **Stage 2: Learning (3 months):** Practical modules with {skills_s2}
• **Stage 3: Projects (2-3 months):** Real-world portfolio implementation
• **Stage 4: Job Preparation (1-2 months):** Resume optimization, mock tests, and interviews

**Suggested Courses:**
• {c1}
• {c2}

**Potential Career Paths:**
{paths_str}"""

@api_router.post("/margadarshak/chat")
async def margadarshak_chat(req: MessageRequest):
    jobs = await fetch_jobs_from_db(include_unpublished=False)
    courses = await fetch_courses_from_db(include_unpublished=False)
    skills = await fetch_skills_from_db(include_unpublished=False)

    try:
        system_message = f"""You are MARGADARSHAK, an AI career counselor for Sankalp. 

IMPORTANT RESPONSE FORMAT:
- Keep responses SHORT and CONCISE (max 3-4 sentences per point)
- Use bullet points for clarity
- Break information into easy-to-read sections
- NO long paragraphs
- Use simple, direct language

Data available in MongoDB catalog:
- {len(jobs)} job roles
- {len(courses)} courses
- {len(skills)} skills

FORMAT EXAMPLE:
**Recommended Domain:** Data Science
**Why:** High demand, good salary, matches your profile

**Quick Roadmap:**
• Stage 1: Foundation: Python, SQL basics
• Stage 2: Learning: ML, Data Analysis
• Stage 3: Projects: Deep Learning, Industry Projects
• Stage 4: Job Preparation: Mock interviews, Portfolio

Keep it brief, clear, and actionable!"""
        
        response = await call_gemini_api(req.message, system_message)
        if not response:
            response = await generate_margadarshak_fallback_response(req.message)
        
        if db is not None:
            try:
                chat_doc = {
                    "session_id": req.session_id,
                    "user_message": req.message,
                    "ai_response": response,
                    "timestamp": utc_now().isoformat()
                }
                await db.margadarshak_chats.insert_one(chat_doc)
            except Exception as dbe:
                logger.warning(f"Could not store chat in DB: {dbe}")
        
        return {"response": response, "session_id": req.session_id}
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        fallback = await generate_margadarshak_fallback_response(req.message)
        return {"response": fallback, "session_id": req.session_id}


# ============= SAMARTHYA (SKILLS-TO-JOBS MAPPING) =============
@api_router.post("/samarthya/profile")
async def create_profile(profile: UserProfile):
    check_db()
    profile_dict = profile.model_dump()
    profile_dict['created_at'] = profile_dict['created_at'].isoformat()
    await db.user_profiles.insert_one(profile_dict)
    return {"message": "Profile created", "user_id": profile.user_id}

@api_router.post("/samarthya/match")
async def match_skills_to_jobs(user_skills: List[str]):
    jobs = await fetch_jobs_from_db(include_unpublished=False)
    matched_jobs = []
    
    for job in jobs:
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


# ============= DRISHTIKON (CAREER INSIGHTS DASHBOARD) =============
@api_router.get("/drishtikon/insights")
async def get_career_insights():
    jobs = await fetch_jobs_from_db(include_unpublished=False)
    
    domain_count = {}
    for job in jobs:
        category = job.get('category', 'Other')
        domain_count[category] = domain_count.get(category, 0) + 1
    
    salaries = [j.get('avg_salary', 0) for j in jobs]
    avg_salary = sum(salaries) / len(salaries) if salaries else 0
    high_demand_jobs = [j for j in jobs if j.get('demand_level') == 'High']
    
    all_skills = []
    for job in jobs:
        all_skills.extend(job.get('skills_required', []))
    
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
        "total_jobs_analyzed": len(jobs),
        "last_updated": utc_now().isoformat(),
        "source": "mongodb_live_catalog"
    }

@api_router.get("/drishtikon/salary-trends")
async def get_salary_trends():
    jobs = await fetch_jobs_from_db(include_unpublished=False)
    salary_by_category = {}
    for job in jobs:
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


# ============= UNNATI (PROGRESS TRACKER & ROADMAP MANAGEMENT) =============
@api_router.get("/unnati/{user_id}")
async def get_progress(user_id: str, current_user: str = Depends(get_current_user)):
    check_db()
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")
    
    items = await db.progress_items.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    
    total_items = len(items)
    completed = len([i for i in items if i.get('status') == 'completed'])
    in_progress = len([i for i in items if i.get('status') == 'in_progress'])
    not_started = len([i for i in items if i.get('status') == 'not_started'])
    
    now = datetime.now(timezone.utc)
    upcoming = []
    for item in items:
        if item.get('due_date') and item.get('status') != 'completed':
            due_date = datetime.fromisoformat(item['due_date']) if isinstance(item['due_date'], str) else item['due_date']
            if due_date > now:
                upcoming.append(item)
    
    upcoming.sort(key=lambda x: str(x.get('due_date', '')))
    
    return {
        "items": items,
        "stats": {
            "total": total_items,
            "completed": completed,
            "in_progress": in_progress,
            "not_started": not_started,
            "completion_rate": round((completed / total_items * 100) if total_items > 0 else 0, 1)
        },
        "upcoming_deadlines": upcoming[:5]
    }

@api_router.post("/unnati/{user_id}/update")
async def update_progress(user_id: str, update_data: UpdateProgressRequest, current_user: str = Depends(get_current_user)):
    check_db()
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")
    
    item = await db.progress_items.find_one({"id": update_data.item_id, "user_id": user_id})
    if not item:
        raise HTTPException(status_code=404, detail="Progress item not found")
    
    update_fields = {"updated_at": utc_now().isoformat()}
    if update_data.status:
        update_fields["status"] = update_data.status
    if update_data.percent_complete is not None:
        update_fields["percent_complete"] = update_data.percent_complete
        if update_data.percent_complete == 100:
            update_fields["status"] = "completed"
        elif update_data.percent_complete > 0:
            update_fields["status"] = "in_progress"
    
    await db.progress_items.update_one(
        {"id": update_data.item_id, "user_id": user_id},
        {"$set": update_fields}
    )
    return {"message": "Progress updated successfully"}

@api_router.post("/unnati/{user_id}/import-roadmap")
async def import_roadmap(user_id: str, import_data: ImportRoadmapRequest, current_user: str = Depends(get_current_user)):
    check_db()
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")
    
    roadmap = import_data.roadmap
    items_to_insert = []
    
    for level in roadmap.get('levels', []):
        level_name = level.get('level', level.get('stage_name', 'Unknown Stage'))
        
        for skill in level.get('skills', []):
            items_to_insert.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": f"{level_name}: {skill}",
                "type": "skill",
                "status": "not_started",
                "percent_complete": 0.0,
                "start_date": None,
                "due_date": None,
                "description": f"Learn {skill} skill",
                "metadata_json": {"level": level_name, "roadmap_career": roadmap.get('career')},
                "created_at": utc_now().isoformat(),
                "updated_at": utc_now().isoformat()
            })
        
        for course in level.get('courses', []):
            items_to_insert.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": course,
                "type": "course",
                "status": "not_started",
                "percent_complete": 0.0,
                "start_date": None,
                "due_date": None,
                "description": f"Complete {course}",
                "metadata_json": {"level": level_name, "roadmap_career": roadmap.get('career')},
                "created_at": utc_now().isoformat(),
                "updated_at": utc_now().isoformat()
            })
        
        for project in level.get('projects', []):
            items_to_insert.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": project,
                "type": "project",
                "status": "not_started",
                "percent_complete": 0.0,
                "start_date": None,
                "due_date": None,
                "description": f"Build {project}",
                "metadata_json": {"level": level_name, "roadmap_career": roadmap.get('career')},
                "created_at": utc_now().isoformat(),
                "updated_at": utc_now().isoformat()
            })
    
    if items_to_insert:
        await db.progress_items.insert_many(items_to_insert)
    
    return {"message": f"Imported {len(items_to_insert)} items from roadmap", "count": len(items_to_insert)}

@api_router.post("/unnati/{user_id}/add-goal")
async def add_custom_goal(user_id: str, goal_data: CreateGoalRequest, current_user: str = Depends(get_current_user)):
    check_db()
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")
    
    goal_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": goal_data.title,
        "type": "custom_goal",
        "status": "not_started",
        "percent_complete": 0.0,
        "start_date": goal_data.start_date.isoformat() if goal_data.start_date else None,
        "due_date": goal_data.due_date.isoformat() if goal_data.due_date else None,
        "description": goal_data.description,
        "metadata_json": {"custom": True},
        "created_at": utc_now().isoformat(),
        "updated_at": utc_now().isoformat()
    }
    await db.progress_items.insert_one(goal_doc)
    return {"message": "Goal created successfully", "goal_id": goal_doc["id"]}

@api_router.post("/unnati/{user_id}/update-goal")
async def update_custom_goal(user_id: str, goal_id: str, goal_data: CreateGoalRequest, current_user: str = Depends(get_current_user)):
    check_db()
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_fields = {
        "title": goal_data.title,
        "description": goal_data.description,
        "start_date": goal_data.start_date.isoformat() if goal_data.start_date else None,
        "due_date": goal_data.due_date.isoformat() if goal_data.due_date else None,
        "updated_at": utc_now().isoformat()
    }
    result = await db.progress_items.update_one(
        {"id": goal_id, "user_id": user_id},
        {"$set": update_fields}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal updated successfully"}

@api_router.delete("/unnati/{user_id}/delete-goal/{goal_id}")
async def delete_custom_goal(user_id: str, goal_id: str, current_user: str = Depends(get_current_user)):
    check_db()
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await db.progress_items.delete_one({"id": goal_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted successfully"}


# ============= SAHYOG (COMMUNITY SUPPORT & MENTORS) =============
@api_router.get("/sahyog/posts")
async def get_community_posts(type: Optional[str] = None):
    if db is None:
        return {"posts": [], "total": 0}
    try:
        query = {"type": type} if type else {}
        posts = await db.community_posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
        return {"posts": posts, "total": len(posts)}
    except Exception as e:
        logger.warning(f"Error fetching community posts: {e}")
        return {"posts": [], "total": 0}

@api_router.post("/sahyog/posts")
async def create_community_post(post: CommunityPost):
    check_db()
    post_dict = post.model_dump()
    post_dict['created_at'] = post_dict['created_at'].isoformat()
    await db.community_posts.insert_one(post_dict)
    return {"message": "Post created", "post_id": post.post_id}

@api_router.post("/sahyog/mentor-request")
async def create_mentor_request(request: MentorRequest):
    check_db()
    request_dict = request.model_dump()
    request_dict['created_at'] = request_dict['created_at'].isoformat()
    await db.mentor_requests.insert_one(request_dict)
    return {"message": "Mentor request submitted", "request_id": request.request_id}

@api_router.get("/sahyog/resources")
async def get_resources():
    return {
        "resources": [
            {"title": "Getting Started with Career Planning", "type": "guide", "url": "#"},
            {"title": "Resume Writing Tips", "type": "guide", "url": "#"},
            {"title": "Interview Preparation Checklist", "type": "resource", "url": "#"},
            {"title": "Top Free Learning Platforms", "type": "resource", "url": "#"},
        ]
    }


# ============= ADMIN DATA CONTROL CENTER =============

@api_router.get("/admin/statistics")
async def get_admin_statistics(admin_email: str = Depends(get_current_admin)):
    check_db()
    total_users = await db.users.count_documents({})
    total_jobs = await db.jobs.count_documents({})
    total_skills = await db.skills.count_documents({})
    total_courses = await db.courses.count_documents({})
    total_colleges = await db.colleges.count_documents({})
    recent_users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    last_sync = await db.sync_runs.find_one(sort=[("started_at", -1)], projection={"_id": 0})

    return {
        "total_users": total_users,
        "total_skills": total_skills,
        "total_jobs": total_jobs,
        "total_courses": total_courses,
        "total_colleges": total_colleges,
        "recent_users": recent_users,
        "last_sync": last_sync
    }

@api_router.post("/admin/migration/run")
async def trigger_admin_migration(admin_email: str = Depends(get_current_admin)):
    """Allow administrative execution of idempotent seed migration."""
    check_db()
    result = await run_data_migration(actor=f"admin:{admin_email}")
    return {"message": "Migration completed successfully", "details": result}

# --- Jobs Management ---
@api_router.get("/admin/jobs")
async def admin_get_jobs(
    status: Optional[str] = None,
    search: Optional[str] = None,
    admin_email: str = Depends(get_current_admin)
):
    check_db()
    query = {}
    if status and status != "all":
        query["status"] = status
    if search:
        query["job_title"] = {"$regex": search, "$options": "i"}
    jobs = await db.jobs.find(query, {"_id": 0}).sort("job_id", 1).to_list(1000)
    return {"jobs": jobs, "total": len(jobs)}

@api_router.post("/admin/jobs")
@api_router.post("/admin/jigyasa/jobs")
async def admin_create_job(job_data: dict, admin_email: str = Depends(get_current_admin)):
    check_db()
    highest = await db.jobs.find_one(sort=[("job_id", -1)])
    next_id = (highest.get("job_id", 0) + 1) if highest else 1
    job_data["job_id"] = next_id
    job_data["status"] = job_data.get("status", "published")
    job_data["source"] = job_data.get("source", "admin_manual")
    job_data["created_at"] = utc_now().isoformat()
    job_data["updated_at"] = utc_now().isoformat()

    await db.jobs.insert_one(job_data)
    await db.audit_logs.insert_one(AuditLogModel(
        action="create", collection_name="jobs", entity_id=str(next_id),
        actor=admin_email, changes={"job_title": job_data.get("job_title")}
    ).model_dump())
    cache.invalidate()
    job_data.pop("_id", None)
    return {"message": "Job added successfully", "job": job_data}

@api_router.put("/admin/jobs/{job_id}")
@api_router.put("/admin/jigyasa/jobs/{job_id}")
async def admin_update_job(job_id: int, job_data: dict, admin_email: str = Depends(get_current_admin)):
    check_db()
    job_data["job_id"] = job_id
    job_data["updated_at"] = utc_now().isoformat()
    job_data.pop("_id", None)

    res = await db.jobs.update_one({"job_id": job_id}, {"$set": job_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")

    await db.audit_logs.insert_one(AuditLogModel(
        action="update", collection_name="jobs", entity_id=str(job_id),
        actor=admin_email, changes={"job_title": job_data.get("job_title")}
    ).model_dump())
    cache.invalidate()
    return {"message": "Job updated successfully", "job": job_data}

@api_router.delete("/admin/jobs/{job_id}")
@api_router.delete("/admin/jigyasa/jobs/{job_id}")
async def admin_delete_job(job_id: int, admin_email: str = Depends(get_current_admin)):
    check_db()
    existing = await db.jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Job not found")

    await db.jobs.delete_one({"job_id": job_id})
    await db.audit_logs.insert_one(AuditLogModel(
        action="delete", collection_name="jobs", entity_id=str(job_id),
        actor=admin_email, changes={"job_title": existing.get("job_title")}
    ).model_dump())
    cache.invalidate()
    return {"message": "Job deleted successfully", "job": existing}

@api_router.patch("/admin/jobs/{job_id}/status")
async def admin_update_job_status(job_id: int, req: StatusUpdateRequest, admin_email: str = Depends(get_current_admin)):
    check_db()
    res = await db.jobs.update_one({"job_id": job_id}, {"$set": {"status": req.status, "updated_at": utc_now().isoformat()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    cache.invalidate()
    return {"message": f"Job status updated to {req.status}"}


# --- Skills Management ---
@api_router.get("/admin/skills")
async def admin_get_skills(
    status: Optional[str] = None,
    search: Optional[str] = None,
    admin_email: str = Depends(get_current_admin)
):
    check_db()
    query = {}
    if status and status != "all":
        query["status"] = status
    if search:
        query["skill_name"] = {"$regex": search, "$options": "i"}
    skills = await db.skills.find(query, {"_id": 0}).sort("skill_id", 1).to_list(1000)
    return {"skills": skills, "total": len(skills)}

@api_router.post("/admin/skills")
@api_router.post("/admin/jigyasa/skills")
async def admin_create_skill(skill_data: dict, admin_email: str = Depends(get_current_admin)):
    check_db()
    highest = await db.skills.find_one(sort=[("skill_id", -1)])
    next_id = (highest.get("skill_id", 0) + 1) if highest else 1
    skill_data["skill_id"] = next_id
    skill_data["status"] = skill_data.get("status", "published")
    skill_data["source"] = skill_data.get("source", "admin_manual")
    skill_data["created_at"] = utc_now().isoformat()
    skill_data["updated_at"] = utc_now().isoformat()

    await db.skills.insert_one(skill_data)
    await db.audit_logs.insert_one(AuditLogModel(
        action="create", collection_name="skills", entity_id=str(next_id),
        actor=admin_email, changes={"skill_name": skill_data.get("skill_name")}
    ).model_dump())
    cache.invalidate()
    skill_data.pop("_id", None)
    return {"message": "Skill added successfully", "skill": skill_data}

@api_router.put("/admin/skills/{skill_id}")
@api_router.put("/admin/jigyasa/skills/{skill_id}")
async def admin_update_skill(skill_id: int, skill_data: dict, admin_email: str = Depends(get_current_admin)):
    check_db()
    skill_data["skill_id"] = skill_id
    skill_data["updated_at"] = utc_now().isoformat()
    skill_data.pop("_id", None)

    res = await db.skills.update_one({"skill_id": skill_id}, {"$set": skill_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Skill not found")

    await db.audit_logs.insert_one(AuditLogModel(
        action="update", collection_name="skills", entity_id=str(skill_id),
        actor=admin_email, changes={"skill_name": skill_data.get("skill_name")}
    ).model_dump())
    cache.invalidate()
    return {"message": "Skill updated successfully", "skill": skill_data}

@api_router.delete("/admin/skills/{skill_id}")
@api_router.delete("/admin/jigyasa/skills/{skill_id}")
async def admin_delete_skill(skill_id: int, admin_email: str = Depends(get_current_admin)):
    check_db()
    existing = await db.skills.find_one({"skill_id": skill_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Skill not found")

    await db.skills.delete_one({"skill_id": skill_id})
    await db.audit_logs.insert_one(AuditLogModel(
        action="delete", collection_name="skills", entity_id=str(skill_id),
        actor=admin_email, changes={"skill_name": existing.get("skill_name")}
    ).model_dump())
    cache.invalidate()
    return {"message": "Skill deleted successfully", "skill": existing}

@api_router.patch("/admin/skills/{skill_id}/status")
async def admin_update_skill_status(skill_id: int, req: StatusUpdateRequest, admin_email: str = Depends(get_current_admin)):
    check_db()
    res = await db.skills.update_one({"skill_id": skill_id}, {"$set": {"status": req.status, "updated_at": utc_now().isoformat()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Skill not found")
    cache.invalidate()
    return {"message": f"Skill status updated to {req.status}"}


# --- Courses Management ---
@api_router.get("/admin/courses")
async def admin_get_courses(
    status: Optional[str] = None,
    search: Optional[str] = None,
    admin_email: str = Depends(get_current_admin)
):
    check_db()
    query = {}
    if status and status != "all":
        query["status"] = status
    if search:
        query["course_name"] = {"$regex": search, "$options": "i"}
    courses = await db.courses.find(query, {"_id": 0}).sort("course_id", 1).to_list(1000)
    return {"courses": courses, "total": len(courses)}

@api_router.post("/admin/courses")
async def admin_create_course(course_data: dict, admin_email: str = Depends(get_current_admin)):
    check_db()
    highest = await db.courses.find_one(sort=[("course_id", -1)])
    next_id = (highest.get("course_id", 0) + 1) if highest else 1
    course_data["course_id"] = next_id
    course_data["status"] = course_data.get("status", "published")
    course_data["source"] = course_data.get("source", "admin_manual")
    course_data["created_at"] = utc_now().isoformat()
    course_data["updated_at"] = utc_now().isoformat()

    await db.courses.insert_one(course_data)
    await db.audit_logs.insert_one(AuditLogModel(
        action="create", collection_name="courses", entity_id=str(next_id),
        actor=admin_email, changes={"course_name": course_data.get("course_name")}
    ).model_dump())
    cache.invalidate()
    course_data.pop("_id", None)
    return {"message": "Course added successfully", "course": course_data}

@api_router.put("/admin/courses/{course_id}")
async def admin_update_course(course_id: int, course_data: dict, admin_email: str = Depends(get_current_admin)):
    check_db()
    course_data["course_id"] = course_id
    course_data["updated_at"] = utc_now().isoformat()
    course_data.pop("_id", None)

    res = await db.courses.update_one({"course_id": course_id}, {"$set": course_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")

    await db.audit_logs.insert_one(AuditLogModel(
        action="update", collection_name="courses", entity_id=str(course_id),
        actor=admin_email, changes={"course_name": course_data.get("course_name")}
    ).model_dump())
    cache.invalidate()
    return {"message": "Course updated successfully", "course": course_data}

@api_router.delete("/admin/courses/{course_id}")
async def admin_delete_course(course_id: int, admin_email: str = Depends(get_current_admin)):
    check_db()
    existing = await db.courses.find_one({"course_id": course_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Course not found")

    await db.courses.delete_one({"course_id": course_id})
    await db.audit_logs.insert_one(AuditLogModel(
        action="delete", collection_name="courses", entity_id=str(course_id),
        actor=admin_email, changes={"course_name": existing.get("course_name")}
    ).model_dump())
    cache.invalidate()
    return {"message": "Course deleted successfully", "course": existing}


# --- Colleges Management ---
@api_router.get("/admin/colleges")
async def admin_get_colleges(
    status: Optional[str] = None,
    search: Optional[str] = None,
    admin_email: str = Depends(get_current_admin)
):
    check_db()
    query = {}
    if status and status != "all":
        query["status"] = status
    if search:
        query["$or"] = [
            {"college_name": {"$regex": search, "$options": "i"}},
            {"program_name": {"$regex": search, "$options": "i"}}
        ]
    colleges = await db.colleges.find(query, {"_id": 0}).sort("college_id", 1).to_list(1000)
    return {"colleges": colleges, "total": len(colleges)}

@api_router.post("/admin/colleges")
@api_router.post("/admin/jigyasa/colleges")
async def admin_create_college(college_data: dict, admin_email: str = Depends(get_current_admin)):
    check_db()
    highest = await db.colleges.find_one(sort=[("college_id", -1)])
    next_id = (highest.get("college_id", 0) + 1) if highest else 1
    college_data["college_id"] = next_id
    if "course_id" in college_data and "college_id" not in college_data:
        college_data["college_id"] = college_data["course_id"]
    college_data["status"] = college_data.get("status", "published")
    college_data["source"] = college_data.get("source", "admin_manual")
    college_data["created_at"] = utc_now().isoformat()
    college_data["updated_at"] = utc_now().isoformat()

    await db.colleges.insert_one(college_data)
    await db.audit_logs.insert_one(AuditLogModel(
        action="create", collection_name="colleges", entity_id=str(next_id),
        actor=admin_email, changes={"name": college_data.get("college_name") or college_data.get("institution")}
    ).model_dump())
    cache.invalidate()
    college_data.pop("_id", None)
    return {"message": "College added successfully", "college": college_data}

@api_router.put("/admin/colleges/{college_id}")
@api_router.put("/admin/jigyasa/colleges/{college_id}")
async def admin_update_college(college_id: int, college_data: dict, admin_email: str = Depends(get_current_admin)):
    check_db()
    college_data["college_id"] = college_id
    college_data["updated_at"] = utc_now().isoformat()
    college_data.pop("_id", None)

    res = await db.colleges.update_one({"college_id": college_id}, {"$set": college_data})
    if res.matched_count == 0:
        # Check by course_id in courses for legacy backward-compatibility
        res = await db.courses.update_one({"course_id": college_id}, {"$set": college_data})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="College not found")

    await db.audit_logs.insert_one(AuditLogModel(
        action="update", collection_name="colleges", entity_id=str(college_id),
        actor=admin_email, changes={"name": college_data.get("college_name") or college_data.get("institution")}
    ).model_dump())
    cache.invalidate()
    return {"message": "College updated successfully", "college": college_data}

@api_router.delete("/admin/colleges/{college_id}")
@api_router.delete("/admin/jigyasa/colleges/{college_id}")
async def admin_delete_college(college_id: int, admin_email: str = Depends(get_current_admin)):
    check_db()
    existing = await db.colleges.find_one({"college_id": college_id}, {"_id": 0})
    if not existing:
        existing = await db.courses.find_one({"course_id": college_id}, {"_id": 0})
        if existing:
            await db.courses.delete_one({"course_id": college_id})
    else:
        await db.colleges.delete_one({"college_id": college_id})

    if not existing:
        raise HTTPException(status_code=404, detail="College not found")

    await db.audit_logs.insert_one(AuditLogModel(
        action="delete", collection_name="colleges", entity_id=str(college_id),
        actor=admin_email, changes={"name": existing.get("college_name") or existing.get("institution")}
    ).model_dump())
    cache.invalidate()
    return {"message": "College deleted successfully", "college": existing}


# --- Ingestion Pipeline & Sync Runs ---
@api_router.get("/admin/sync/sources")
async def admin_get_sources(admin_email: str = Depends(get_current_admin)):
    check_db()
    sources = await db.data_sources.find({}, {"_id": 0}).to_list(100)
    return {"sources": sources}

@api_router.post("/admin/sync/sources")
async def admin_save_source(source: DataSourceModel, admin_email: str = Depends(get_current_admin)):
    check_db()
    source_dict = source.model_dump()
    source_dict["last_sync_at"] = source_dict["last_sync_at"].isoformat() if source_dict["last_sync_at"] else None
    source_dict["created_at"] = source_dict["created_at"].isoformat()
    await db.data_sources.update_one(
        {"source_id": source.source_id},
        {"$set": source_dict},
        upsert=True
    )
    return {"message": "Data source saved", "source": source_dict}

@api_router.post("/admin/sync/run")
async def admin_trigger_sync(req: TriggerSyncRequest, admin_email: str = Depends(get_current_admin)):
    check_db()
    if req.source_id == "manual_upload" and req.payload:
        adapter = ManualUploadAdapter(payload=req.payload, admin_email=admin_email)
    else:
        adapter = CuratedPublicFeedAdapter()

    pipeline = IngestionPipeline(adapter=adapter, actor=f"admin:{admin_email}")
    run_result = await pipeline.run()

    return {
        "message": f"Sync completed with status: {run_result.status}",
        "sync_run": run_result.model_dump()
    }

@api_router.get("/admin/sync/history")
async def admin_get_sync_history(limit: int = 15, admin_email: str = Depends(get_current_admin)):
    check_db()
    runs = await db.sync_runs.find({}, {"_id": 0}).sort("started_at", -1).limit(limit).to_list(limit)
    return {"history": runs}

@api_router.get("/admin/audit-logs")
async def admin_get_audit_logs(limit: int = 30, admin_email: str = Depends(get_current_admin)):
    check_db()
    logs = await db.audit_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return {"logs": logs}


# Include router
app.include_router(api_router)

# Mount static files and SPA fallback if frontend build exists
frontend_build_dir = ROOT_DIR.parent / "frontend" / "build"
if frontend_build_dir.exists():
    static_dir = frontend_build_dir / "static"
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = frontend_build_dir / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(frontend_build_dir / "index.html"))

@app.on_event("shutdown")
async def shutdown_db_client():
    if client is not None:
        client.close()