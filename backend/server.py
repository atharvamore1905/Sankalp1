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

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# JWT settings
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(authorization: Optional[str] = Cookie(None, alias="sankalp_token")):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(authorization, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_admin(authorization: Optional[str] = Cookie(None, alias="sankalp_admin_token")):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(authorization, SECRET_KEY, algorithms=[ALGORITHM])
        is_admin: bool = payload.get("is_admin", False)
        admin_email: str = payload.get("email")
        if not is_admin or admin_email != "Admin123@gmail.com":
            raise HTTPException(status_code=403, detail="Admin access required")
        return admin_email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Models
# Auth Models
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

# UNNATI Models
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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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

# ============= AUTHENTICATION ENDPOINTS =============
@api_router.post("/auth/signup")
async def signup(signup_data: SignupRequest, response: Response):
    # Validation
    if signup_data.password != signup_data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    if len(signup_data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    if not signup_data.phone_no.isdigit():
        raise HTTPException(status_code=400, detail="Phone number must be numeric")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": signup_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(signup_data.password)
    
    user_doc = {
        "id": user_id,
        "name": signup_data.name,
        "email": signup_data.email,
        "phone_no": signup_data.phone_no,
        "password_hash": hashed_password,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create JWT token
    access_token = create_access_token(data={"sub": user_id, "email": signup_data.email})
    
    # Set cookie
    response.set_cookie(
        key="sankalp_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax"
    )
    
    return {
        "message": "User created successfully",
        "user": {
            "id": user_id,
            "name": signup_data.name,
            "email": signup_data.email
        }
    }

@api_router.post("/auth/login")
async def login(login_data: LoginRequest, response: Response):
    # Find user
    user = await db.users.find_one({"email": login_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create JWT token
    access_token = create_access_token(data={"sub": user["id"], "email": user["email"]})
    
    # Set cookie
    response.set_cookie(
        key="sankalp_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax"
    )
    
    return {
        "message": "Login successful",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"]
        }
    }

@api_router.get("/auth/me")
async def get_me(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": user}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="sankalp_token")
    return {"message": "Logged out successfully"}

# ============= ADMIN AUTHENTICATION =============
@api_router.post("/admin/login")
async def admin_login(login_data: AdminLoginRequest, response: Response):
    # Hardcoded admin credentials
    ADMIN_EMAIL = "Admin123@gmail.com"
    ADMIN_PASSWORD = "Admin123"
    
    if login_data.email != ADMIN_EMAIL or login_data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    # Create JWT token with admin flag
    access_token = create_access_token(data={
        "sub": "admin",
        "email": ADMIN_EMAIL,
        "is_admin": True
    })
    
    # Set cookie
    response.set_cookie(
        key="sankalp_admin_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax"
    )
    
    return {
        "message": "Admin login successful",
        "admin": {"email": ADMIN_EMAIL}
    }

@api_router.get("/admin/me")
async def get_admin(admin_email: str = Depends(get_current_admin)):
    return {"admin": {"email": admin_email, "role": "admin"}}

@api_router.post("/admin/logout")
async def admin_logout(response: Response):
    response.delete_cookie(key="sankalp_admin_token")
    return {"message": "Admin logged out successfully"}

# ============= ADMIN DASHBOARD - STATISTICS =============
@api_router.get("/admin/statistics")
async def get_admin_statistics(admin_email: str = Depends(get_current_admin)):
    # Count users
    total_users = await db.users.count_documents({})
    
    # Get recent users
    recent_users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "total_users": total_users,
        "total_skills": len(SKILLS_DATA),
        "total_jobs": len(JOBS_DATA),
        "total_courses": len(COURSES_DATA),
        "recent_users": recent_users
    }

# ============= ADMIN - JIGYASA DATA MANAGEMENT =============
# Colleges/Courses Management
@api_router.post("/admin/jigyasa/colleges")
async def add_college(college_data: dict, admin_email: str = Depends(get_current_admin)):
    # Generate new ID
    max_id = max([c.get('course_id', 0) for c in COURSES_DATA]) if COURSES_DATA else 0
    college_data['course_id'] = max_id + 1
    
    COURSES_DATA.append(college_data)
    
    # Save to file
    with open(ROOT_DIR / 'data_courses.json', 'w') as f:
        json.dump(COURSES_DATA, f, indent=2)
    
    return {"message": "College added successfully", "college": college_data}

@api_router.put("/admin/jigyasa/colleges/{course_id}")
async def update_college(course_id: int, college_data: dict, admin_email: str = Depends(get_current_admin)):
    for i, college in enumerate(COURSES_DATA):
        if college['course_id'] == course_id:
            college_data['course_id'] = course_id
            COURSES_DATA[i] = college_data
            
            # Save to file
            with open(ROOT_DIR / 'data_courses.json', 'w') as f:
                json.dump(COURSES_DATA, f, indent=2)
            
            return {"message": "College updated successfully", "college": college_data}
    
    raise HTTPException(status_code=404, detail="College not found")

@api_router.delete("/admin/jigyasa/colleges/{course_id}")
async def delete_college(course_id: int, admin_email: str = Depends(get_current_admin)):
    for i, college in enumerate(COURSES_DATA):
        if college['course_id'] == course_id:
            deleted = COURSES_DATA.pop(i)
            
            # Save to file
            with open(ROOT_DIR / 'data_courses.json', 'w') as f:
                json.dump(COURSES_DATA, f, indent=2)
            
            return {"message": "College deleted successfully", "college": deleted}
    
    raise HTTPException(status_code=404, detail="College not found")

# Skills Management
@api_router.post("/admin/jigyasa/skills")
async def add_skill(skill_data: dict, admin_email: str = Depends(get_current_admin)):
    max_id = max([s.get('skill_id', 0) for s in SKILLS_DATA]) if SKILLS_DATA else 0
    skill_data['skill_id'] = max_id + 1
    
    SKILLS_DATA.append(skill_data)
    
    with open(ROOT_DIR / 'data_skills.json', 'w') as f:
        json.dump(SKILLS_DATA, f, indent=2)
    
    return {"message": "Skill added successfully", "skill": skill_data}

@api_router.put("/admin/jigyasa/skills/{skill_id}")
async def update_skill(skill_id: int, skill_data: dict, admin_email: str = Depends(get_current_admin)):
    for i, skill in enumerate(SKILLS_DATA):
        if skill['skill_id'] == skill_id:
            skill_data['skill_id'] = skill_id
            SKILLS_DATA[i] = skill_data
            
            with open(ROOT_DIR / 'data_skills.json', 'w') as f:
                json.dump(SKILLS_DATA, f, indent=2)
            
            return {"message": "Skill updated successfully", "skill": skill_data}
    
    raise HTTPException(status_code=404, detail="Skill not found")

@api_router.delete("/admin/jigyasa/skills/{skill_id}")
async def delete_skill(skill_id: int, admin_email: str = Depends(get_current_admin)):
    for i, skill in enumerate(SKILLS_DATA):
        if skill['skill_id'] == skill_id:
            deleted = SKILLS_DATA.pop(i)
            
            with open(ROOT_DIR / 'data_skills.json', 'w') as f:
                json.dump(SKILLS_DATA, f, indent=2)
            
            return {"message": "Skill deleted successfully", "skill": deleted}
    
    raise HTTPException(status_code=404, detail="Skill not found")

# Jobs Management
@api_router.post("/admin/jigyasa/jobs")
async def add_job(job_data: dict, admin_email: str = Depends(get_current_admin)):
    max_id = max([j.get('job_id', 0) for j in JOBS_DATA]) if JOBS_DATA else 0
    job_data['job_id'] = max_id + 1
    
    JOBS_DATA.append(job_data)
    
    with open(ROOT_DIR / 'data_jobs.json', 'w') as f:
        json.dump(JOBS_DATA, f, indent=2)
    
    return {"message": "Job added successfully", "job": job_data}

@api_router.put("/admin/jigyasa/jobs/{job_id}")
async def update_job(job_id: int, job_data: dict, admin_email: str = Depends(get_current_admin)):
    for i, job in enumerate(JOBS_DATA):
        if job['job_id'] == job_id:
            job_data['job_id'] = job_id
            JOBS_DATA[i] = job_data
            
            with open(ROOT_DIR / 'data_jobs.json', 'w') as f:
                json.dump(JOBS_DATA, f, indent=2)
            
            return {"message": "Job updated successfully", "job": job_data}
    
    raise HTTPException(status_code=404, detail="Job not found")

@api_router.delete("/admin/jigyasa/jobs/{job_id}")
async def delete_job(job_id: int, admin_email: str = Depends(get_current_admin)):
    for i, job in enumerate(JOBS_DATA):
        if job['job_id'] == job_id:
            deleted = JOBS_DATA.pop(i)
            
            with open(ROOT_DIR / 'data_jobs.json', 'w') as f:
                json.dump(JOBS_DATA, f, indent=2)
            
            return {"message": "Job deleted successfully", "job": deleted}
    
    raise HTTPException(status_code=404, detail="Job not found")

# ============= UNNATI - PROGRESS TRACKER =============
@api_router.get("/unnati/{user_id}")
async def get_progress(user_id: str, current_user: str = Depends(get_current_user)):
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")
    
    items = await db.progress_items.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    
    # Calculate stats
    total_items = len(items)
    completed = len([i for i in items if i['status'] == 'completed'])
    in_progress = len([i for i in items if i['status'] == 'in_progress'])
    not_started = len([i for i in items if i['status'] == 'not_started'])
    
    # Upcoming deadlines
    now = datetime.now(timezone.utc)
    upcoming = []
    for item in items:
        if item.get('due_date') and item['status'] != 'completed':
            due_date = datetime.fromisoformat(item['due_date']) if isinstance(item['due_date'], str) else item['due_date']
            if due_date > now:
                upcoming.append(item)
    
    upcoming.sort(key=lambda x: x['due_date'])
    
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
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Find item
    item = await db.progress_items.find_one({"id": update_data.item_id, "user_id": user_id})
    if not item:
        raise HTTPException(status_code=404, detail="Progress item not found")
    
    # Update fields
    update_fields = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if update_data.status:
        update_fields["status"] = update_data.status
    if update_data.percent_complete is not None:
        update_fields["percent_complete"] = update_data.percent_complete
        # Auto-update status based on percentage
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
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")
    
    roadmap = import_data.roadmap
    items_to_insert = []
    
    # Extract roadmap levels and create progress items
    for level in roadmap.get('levels', []):
        level_name = level.get('level', 'Unknown')
        
        # Add skills as items
        for skill in level.get('skills', []):
            item = {
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
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            items_to_insert.append(item)
        
        # Add courses as items
        for course in level.get('courses', []):
            item = {
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
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            items_to_insert.append(item)
        
        # Add projects as items
        for project in level.get('projects', []):
            item = {
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
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            items_to_insert.append(item)
    
    if items_to_insert:
        await db.progress_items.insert_many(items_to_insert)
    
    return {"message": f"Imported {len(items_to_insert)} items from roadmap", "count": len(items_to_insert)}

@api_router.post("/unnati/{user_id}/add-goal")
async def add_custom_goal(user_id: str, goal_data: CreateGoalRequest, current_user: str = Depends(get_current_user)):
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
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.progress_items.insert_one(goal_doc)
    return {"message": "Goal created successfully", "goal_id": goal_doc["id"]}

@api_router.post("/unnati/{user_id}/update-goal")
async def update_custom_goal(user_id: str, goal_id: str, goal_data: CreateGoalRequest, current_user: str = Depends(get_current_user)):
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_fields = {
        "title": goal_data.title,
        "description": goal_data.description,
        "start_date": goal_data.start_date.isoformat() if goal_data.start_date else None,
        "due_date": goal_data.due_date.isoformat() if goal_data.due_date else None,
        "updated_at": datetime.now(timezone.utc).isoformat()
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
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await db.progress_items.delete_one({"id": goal_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    return {"message": "Goal deleted successfully"}

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
        system_message = f"""You are MARGADARSHAK, an AI career counselor for Sankalp. 

IMPORTANT RESPONSE FORMAT:
- Keep responses SHORT and CONCISE (max 3-4 sentences per point)
- Use bullet points for clarity
- Break information into easy-to-read sections
- NO long paragraphs
- Use simple, direct language

Data available:
- {len(JOBS_DATA)} job roles
- {len(COURSES_DATA)} courses
- {len(SKILLS_DATA)} skills

FORMAT EXAMPLE:
**Recommended Domain:** Data Science
**Why:** High demand, good salary, matches your profile

**Quick Roadmap:**
• Beginner (2-3 months): Python, SQL basics
• Intermediate (3-4 months): ML, Data Analysis
• Advanced (4-5 months): Deep Learning, Projects

Keep it brief, clear, and actionable!"""
        
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