import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger("sankalp.demo")

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

# Realistic fictional sample candidate profile for demonstration
SAMPLE_DEMO_PROFILE = {
    "name": "Aarav Sharma",
    "headline": "Pre-final Year B.Tech Student & Aspiring Data Specialist",
    "email": "aarav.demo@sankalp.ai",
    "phone_no": "+91 98765 43210",
    "location": "Pune, Maharashtra",
    "education": {
        "degree": "B.Tech in Computer Engineering",
        "institution": "Pune Institute of Computer Technology",
        "graduation_year": 2027,
        "gpa": 8.2,
        "marks_12th": 84.0,
        "marks_10th": 88.0,
        "backlogs": 0
    },
    "skills": ["Python", "SQL", "Excel", "Data Visualization", "JavaScript", "React"],
    "certifications": [
        {
            "title": "Google Data Analytics Professional Certificate",
            "issuer": "Coursera / Google",
            "year": 2025
        },
        {
            "title": "Full-Stack Web Development Foundation",
            "issuer": "Sankalp Learning Path",
            "year": 2025
        }
    ],
    "projects": [
        {
            "title": "Student Career Placement Predictor",
            "tech_stack": ["Python", "Scikit-Learn", "FastAPI"],
            "description": "Built a predictive model scoring candidate readiness against entry-level tech requirements."
        },
        {
            "title": "Sankalp Community Collaboration Portal",
            "tech_stack": ["React", "Node.js", "MongoDB"],
            "description": "Developed a collaborative peer study group and mentor matching module."
        }
    ],
    "target_domain": "Data Science / Analytics",
    "preferred_roles": ["Data Analyst", "Data Scientist", "Full-Stack Web Developer"],
    "is_demo_profile": True
}

# Initial sample goals and milestones for the Unnati progress tracker
SAMPLE_DEMO_GOALS = [
    {
        "id": "demo-item-1",
        "title": "Stage 1: SQL & Database Query Optimization",
        "type": "skill",
        "status": "completed",
        "percent_complete": 100.0,
        "start_date": (utc_now() - timedelta(days=30)).isoformat(),
        "due_date": (utc_now() - timedelta(days=5)).isoformat(),
        "description": "Master complex joins, indexing, and window functions.",
        "metadata_json": {"level": "Foundation", "is_demo": True}
    },
    {
        "id": "demo-item-2",
        "title": "Stage 2: Python Data Science Bootcamp (Pandas & NumPy)",
        "type": "course",
        "status": "in_progress",
        "percent_complete": 65.0,
        "start_date": (utc_now() - timedelta(days=14)).isoformat(),
        "due_date": (utc_now() + timedelta(days=14)).isoformat(),
        "description": "Complete interactive exercises and statistical modeling assignments.",
        "metadata_json": {"level": "Learning", "is_demo": True}
    },
    {
        "id": "demo-item-3",
        "title": "Stage 3: End-to-End Analytics Portfolio Dashboard",
        "type": "project",
        "status": "not_started",
        "percent_complete": 0.0,
        "start_date": (utc_now() + timedelta(days=15)).isoformat(),
        "due_date": (utc_now() + timedelta(days=45)).isoformat(),
        "description": "Deploy public dashboard on Vercel with live MongoDB connection.",
        "metadata_json": {"level": "Projects", "is_demo": True}
    },
    {
        "id": "demo-item-4",
        "title": "Stage 4: Technical Mock Interviews & Resume Review",
        "type": "custom_goal",
        "status": "not_started",
        "percent_complete": 0.0,
        "start_date": (utc_now() + timedelta(days=46)).isoformat(),
        "due_date": (utc_now() + timedelta(days=60)).isoformat(),
        "description": "Schedule 2 peer mock interviews through Sahyog and refine LinkedIn.",
        "metadata_json": {"level": "Job Preparation", "is_demo": True}
    }
]

# In-memory isolation fallback for demo sessions (also synced with MongoDB demo_sessions collection)
_demo_sessions_memory: Dict[str, Dict[str, Any]] = {}

class DemoSessionManager:
    @staticmethod
    def create_session(session_id: Optional[str] = None) -> Dict[str, Any]:
        """Initialize an isolated guest demo session with realistic sample data."""
        sid = session_id or f"guest_{uuid.uuid4().hex[:12]}"
        now = utc_now()
        session_data = {
            "session_id": sid,
            "user_id": sid,
            "name": "Aarav Sharma (Guest Demo)",
            "email": f"demo.{sid[:10]}@guest.sankalp.ai",
            "phone_no": "+91 98765 43210",
            "role": "guest",
            "is_guest": True,
            "profile": dict(SAMPLE_DEMO_PROFILE),
            "progress_items": [dict(item) for item in SAMPLE_DEMO_GOALS],
            "chat_count": 0,
            "max_chat_limit": 5,
            "created_at": now.isoformat(),
            "expires_at": (now + timedelta(hours=24)).isoformat(),
            "last_active_at": now.isoformat()
        }
        _demo_sessions_memory[sid] = session_data
        return session_data

    @staticmethod
    async def get_session(session_id: str, db: Any = None) -> Optional[Dict[str, Any]]:
        """Retrieve guest session from memory or MongoDB Atlas demo_sessions."""
        if not session_id or not session_id.startswith("guest_"):
            return None

        # Check in-memory store
        session = _demo_sessions_memory.get(session_id)
        if session:
            # Check expiration
            expires_at = datetime.fromisoformat(session["expires_at"]) if isinstance(session["expires_at"], str) else session["expires_at"]
            if utc_now() > expires_at:
                _demo_sessions_memory.pop(session_id, None)
                return None
            return session

        # Check MongoDB demo_sessions collection
        if db is not None:
            try:
                doc = await db.demo_sessions.find_one({"session_id": session_id}, {"_id": 0})
                if doc:
                    _demo_sessions_memory[session_id] = doc
                    return doc
            except Exception as e:
                logger.warning(f"Error fetching demo session from DB: {e}")

        # If session valid format but missing (e.g., server restart), lazily recreate it
        recreated = DemoSessionManager.create_session(session_id=session_id)
        return recreated

    @staticmethod
    async def save_session(session_data: Dict[str, Any], db: Any = None) -> None:
        """Persist demo session state isolated from real production users."""
        sid = session_data.get("session_id")
        if not sid:
            return
        session_data["last_active_at"] = utc_now().isoformat()
        _demo_sessions_memory[sid] = session_data

        if db is not None:
            try:
                await db.demo_sessions.update_one(
                    {"session_id": sid},
                    {"$set": session_data},
                    upsert=True
                )
            except Exception as e:
                logger.warning(f"Error persisting demo session to MongoDB: {e}")

    @staticmethod
    async def get_progress(session_id: str, db: Any = None) -> Dict[str, Any]:
        """Fetch demo progress items and live computed metrics for guest."""
        session = await DemoSessionManager.get_session(session_id, db)
        items = session.get("progress_items", []) if session else []

        total_items = len(items)
        completed = len([i for i in items if i.get("status") == "completed"])
        in_progress = len([i for i in items if i.get("status") == "in_progress"])
        not_started = len([i for i in items if i.get("status") == "not_started"])

        now = utc_now()
        upcoming = []
        for item in items:
            if item.get("due_date") and item.get("status") != "completed":
                try:
                    due = datetime.fromisoformat(item["due_date"]) if isinstance(item["due_date"], str) else item["due_date"]
                    if due > now:
                        upcoming.append(item)
                except Exception:
                    pass

        upcoming.sort(key=lambda x: str(x.get("due_date", "")))

        return {
            "items": items,
            "stats": {
                "total": total_items,
                "completed": completed,
                "in_progress": in_progress,
                "not_started": not_started,
                "completion_rate": round((completed / total_items * 100) if total_items > 0 else 0, 1)
            },
            "upcoming_deadlines": upcoming[:5],
            "is_demo_mode": True
        }

    @staticmethod
    async def add_goal(session_id: str, goal_data: Dict[str, Any], db: Any = None) -> Dict[str, Any]:
        session = await DemoSessionManager.get_session(session_id, db)
        if not session:
            session = DemoSessionManager.create_session(session_id)

        item_id = f"demo-goal-{uuid.uuid4().hex[:8]}"
        new_item = {
            "id": item_id,
            "user_id": session_id,
            "title": goal_data.get("title", "Custom Goal"),
            "type": "custom_goal",
            "status": "not_started",
            "percent_complete": 0.0,
            "start_date": goal_data.get("start_date"),
            "due_date": goal_data.get("due_date"),
            "description": goal_data.get("description", ""),
            "metadata_json": {"custom": True, "is_demo": True},
            "created_at": utc_now().isoformat(),
            "updated_at": utc_now().isoformat()
        }
        session["progress_items"].append(new_item)
        await DemoSessionManager.save_session(session, db)
        return {"message": "Demo goal created successfully (temporary demo session)", "goal_id": item_id, "is_demo": True}

    @staticmethod
    async def update_progress(session_id: str, item_id: str, status: Optional[str], percent: Optional[float], db: Any = None) -> bool:
        session = await DemoSessionManager.get_session(session_id, db)
        if not session:
            return False

        updated = False
        for item in session.get("progress_items", []):
            if item.get("id") == item_id:
                if status:
                    item["status"] = status
                if percent is not None:
                    item["percent_complete"] = percent
                    if percent == 100:
                        item["status"] = "completed"
                    elif percent > 0:
                        item["status"] = "in_progress"
                item["updated_at"] = utc_now().isoformat()
                updated = True
                break

        if updated:
            await DemoSessionManager.save_session(session, db)
        return updated

    @staticmethod
    async def delete_goal(session_id: str, goal_id: str, db: Any = None) -> bool:
        session = await DemoSessionManager.get_session(session_id, db)
        if not session:
            return False

        initial_len = len(session.get("progress_items", []))
        session["progress_items"] = [i for i in session.get("progress_items", []) if i.get("id") != goal_id]
        if len(session["progress_items"]) < initial_len:
            await DemoSessionManager.save_session(session, db)
            return True
        return False

    @staticmethod
    async def import_roadmap(session_id: str, roadmap: Dict[str, Any], db: Any = None) -> int:
        session = await DemoSessionManager.get_session(session_id, db)
        if not session:
            session = DemoSessionManager.create_session(session_id)

        count = 0
        career = roadmap.get("career", "Target Career")
        for level in roadmap.get("levels", []):
            level_name = level.get("level", level.get("stage_name", "Milestone"))
            for skill in level.get("skills", []):
                session["progress_items"].append({
                    "id": f"demo-skill-{uuid.uuid4().hex[:8]}",
                    "user_id": session_id,
                    "title": f"{level_name}: {skill}",
                    "type": "skill",
                    "status": "not_started",
                    "percent_complete": 0.0,
                    "description": f"Learn {skill} for {career}",
                    "metadata_json": {"level": level_name, "is_demo": True},
                    "created_at": utc_now().isoformat()
                })
                count += 1
            for course in level.get("courses", []):
                session["progress_items"].append({
                    "id": f"demo-course-{uuid.uuid4().hex[:8]}",
                    "user_id": session_id,
                    "title": course,
                    "type": "course",
                    "status": "not_started",
                    "percent_complete": 0.0,
                    "description": f"Complete course for {career}",
                    "metadata_json": {"level": level_name, "is_demo": True},
                    "created_at": utc_now().isoformat()
                })
                count += 1
        await DemoSessionManager.save_session(session, db)
        return count
