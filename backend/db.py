import os
import json
import logging
import time
from pathlib import Path
from typing import Dict, Any, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

logger = logging.getLogger("sankalp.db")
ROOT_DIR = Path(__file__).parent

# ----------------- In-Memory Cache with TTL -----------------

class CacheManager:
    def __init__(self, default_ttl_seconds: int = 300):
        self._cache: Dict[str, Any] = {}
        self._expiry: Dict[str, float] = {}
        self.default_ttl = default_ttl_seconds

    def get(self, key: str) -> Optional[Any]:
        now = time.time()
        if key in self._cache:
            if now < self._expiry.get(key, 0):
                return self._cache[key]
            else:
                self.delete(key)
        return None

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None):
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
        self._cache[key] = value
        self._expiry[key] = time.time() + ttl

    def delete(self, key: str):
        self._cache.pop(key, None)
        self._expiry.pop(key, None)

    def invalidate(self, prefix: Optional[str] = None):
        if prefix is None:
            self._cache.clear()
            self._expiry.clear()
            logger.info("Global cache cleared.")
        else:
            keys_to_delete = [k for k in self._cache.keys() if k.startswith(prefix)]
            for k in keys_to_delete:
                self.delete(k)
            logger.info(f"Invalidated cache keys matching prefix '{prefix}': {len(keys_to_delete)} removed.")

# Global cache instance
cache = CacheManager(default_ttl_seconds=300)


# ----------------- MongoDB Client & Accessors -----------------

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None

def get_mongo_client() -> Optional[AsyncIOMotorClient]:
    global _client
    if _client is not None:
        return _client
    
    mongo_url = os.environ.get('MONGO_URL')
    if mongo_url:
        try:
            _client = AsyncIOMotorClient(
                mongo_url,
                serverSelectionTimeoutMS=5000,
                maxIdleTimeMS=45000
            )
            return _client
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB Atlas: {e}")
            return None
    elif os.environ.get('LOCAL_DEV') == 'true':
        try:
            _client = AsyncIOMotorClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000)
            return _client
        except Exception as e:
            logger.error(f"Failed to connect to local MongoDB: {e}")
            return None
    return None

def get_db() -> Optional[AsyncIOMotorDatabase]:
    global _db
    if _db is not None:
        return _db
    
    client = get_mongo_client()
    if client is not None:
        db_name = os.environ.get('DB_NAME', 'sankalp')
        _db = client[db_name]
        return _db
    return None

async def init_db_indexes(database: AsyncIOMotorDatabase):
    """Safely initialize essential indexes for query performance and data integrity."""
    if database is None:
        return
    try:
        # Jobs collection indexes
        await database.jobs.create_index("job_id", unique=True)
        await database.jobs.create_index("status")
        await database.jobs.create_index("category")
        await database.jobs.create_index("demand_level")

        # Skills collection indexes
        await database.skills.create_index("skill_id", unique=True)
        await database.skills.create_index("skill_name")
        await database.skills.create_index("status")
        await database.skills.create_index("category")

        # Courses collection indexes
        await database.courses.create_index("course_id", unique=True)
        await database.courses.create_index("status")
        await database.courses.create_index("type")

        # Colleges collection indexes
        await database.colleges.create_index("college_id", unique=True)
        await database.colleges.create_index("status")

        # Interest mappings indexes
        await database.interest_mappings.create_index("domain", unique=True)

        # Ingestion & Audit indexes
        await database.sync_runs.create_index("run_id", unique=True)
        await database.sync_runs.create_index("started_at")
        await database.audit_logs.create_index("timestamp")
        await database.audit_logs.create_index([("collection_name", 1), ("entity_id", 1)])

        logger.info("Successfully initialized MongoDB indexes.")
    except Exception as e:
        logger.warning(f"Could not create database indexes (non-fatal): {e}")


# ----------------- Fallback JSON Loaders -----------------

def load_seed_json(filename: str) -> Any:
    file_path = ROOT_DIR / filename
    if file_path.exists():
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

# ----------------- Database Catalog Query Helpers -----------------

async def fetch_jobs_from_db(include_unpublished: bool = False) -> List[Dict[str, Any]]:
    cached = cache.get("jobs_published" if not include_unpublished else "jobs_all")
    if cached is not None:
        return cached

    db = get_db()
    if db is not None:
        try:
            query = {} if include_unpublished else {"status": "published"}
            cursor = db.jobs.find(query, {"_id": 0}).sort("job_id", 1)
            jobs = await cursor.to_list(1000)
            if jobs:
                cache_key = "jobs_all" if include_unpublished else "jobs_published"
                cache.set(cache_key, jobs, 300)
                return jobs
        except Exception as e:
            logger.warning(f"Error fetching jobs from MongoDB, using fallback: {e}")

    # Fallback to seed JSON
    jobs = load_seed_json("data_jobs.json")
    return jobs

async def fetch_skills_from_db(include_unpublished: bool = False) -> List[Dict[str, Any]]:
    cached = cache.get("skills_published" if not include_unpublished else "skills_all")
    if cached is not None:
        return cached

    db = get_db()
    if db is not None:
        try:
            query = {} if include_unpublished else {"status": "published"}
            cursor = db.skills.find(query, {"_id": 0}).sort("skill_id", 1)
            skills = await cursor.to_list(1000)
            if skills:
                cache_key = "skills_all" if include_unpublished else "skills_published"
                cache.set(cache_key, skills, 300)
                return skills
        except Exception as e:
            logger.warning(f"Error fetching skills from MongoDB, using fallback: {e}")

    # Fallback to seed JSON
    skills = load_seed_json("data_skills.json")
    return skills

async def fetch_courses_from_db(include_unpublished: bool = False) -> List[Dict[str, Any]]:
    cached = cache.get("courses_published" if not include_unpublished else "courses_all")
    if cached is not None:
        return cached

    db = get_db()
    if db is not None:
        try:
            query = {} if include_unpublished else {"status": "published"}
            cursor = db.courses.find(query, {"_id": 0}).sort("course_id", 1)
            courses = await cursor.to_list(1000)
            if courses:
                cache_key = "courses_all" if include_unpublished else "courses_published"
                cache.set(cache_key, courses, 300)
                return courses
        except Exception as e:
            logger.warning(f"Error fetching courses from MongoDB, using fallback: {e}")

    # Fallback to seed JSON
    courses = load_seed_json("data_courses.json")
    return courses

async def fetch_colleges_from_db(include_unpublished: bool = False) -> List[Dict[str, Any]]:
    cached = cache.get("colleges_published" if not include_unpublished else "colleges_all")
    if cached is not None:
        return cached

    db = get_db()
    if db is not None:
        try:
            query = {} if include_unpublished else {"status": "published"}
            cursor = db.colleges.find(query, {"_id": 0}).sort("college_id", 1)
            colleges = await cursor.to_list(1000)
            if colleges:
                cache_key = "colleges_all" if include_unpublished else "colleges_published"
                cache.set(cache_key, colleges, 300)
                return colleges
        except Exception as e:
            logger.warning(f"Error fetching colleges from MongoDB, using fallback: {e}")

    # If colleges collection not populated yet, derive from courses with type UG/PG
    all_courses = await fetch_courses_from_db(include_unpublished)
    colleges = [c for c in all_courses if c.get('type') in ['UG', 'PG', 'Degree']]
    return colleges

async def fetch_interest_mappings_from_db() -> Dict[str, List[str]]:
    cached = cache.get("interest_mappings")
    if cached is not None:
        return cached

    db = get_db()
    if db is not None:
        try:
            cursor = db.interest_mappings.find({"status": "published"}, {"_id": 0})
            docs = await cursor.to_list(100)
            if docs:
                mappings = {doc["domain"]: doc.get("mapped_roles", []) for doc in docs}
                cache.set("interest_mappings", mappings, 300)
                return mappings
        except Exception as e:
            logger.warning(f"Error fetching interest mappings from MongoDB, using fallback: {e}")

    # Fallback to seed JSON
    mappings = load_seed_json("data_interest_matrix.json")
    return mappings if isinstance(mappings, dict) else {}
