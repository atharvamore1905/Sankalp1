import os
import json
import logging
import asyncio
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime, timezone
import uuid

# When run as a script or imported
try:
    from db import get_db, init_db_indexes, cache
    from models import utc_now
except ImportError:
    import sys
    sys.path.append(str(Path(__file__).parent))
    from db import get_db, init_db_indexes, cache
    from models import utc_now

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sankalp.migration")

ROOT_DIR = Path(__file__).parent

def load_json_file(filename: str) -> Any:
    path = ROOT_DIR / filename
    if not path.exists():
        logger.warning(f"Seed file not found: {path}")
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

async def run_data_migration(actor: str = "system:migration") -> Dict[str, Any]:
    """
    Idempotent migration of static JSON datasets into MongoDB Atlas collections.
    Does NOT delete or overwrite user collections (users, progress_items, etc.).
    Uses upserts to ensure safety across repeated runs.
    """
    db = get_db()
    if db is None:
        raise RuntimeError("MongoDB connection is not available. Please verify MONGO_URL.")

    logger.info("Starting safe, idempotent data migration to MongoDB Atlas...")
    await init_db_indexes(db)

    results = {
        "status": "success",
        "started_at": utc_now().isoformat(),
        "jobs_upserted": 0,
        "skills_upserted": 0,
        "courses_upserted": 0,
        "colleges_upserted": 0,
        "interest_mappings_upserted": 0,
        "data_sources_configured": 0
    }

    # 1. Jobs Migration
    jobs_data = load_json_file("data_jobs.json")
    for job in jobs_data:
        job_id = job.get("job_id")
        if not job_id:
            continue
        doc = {
            "job_id": job_id,
            "job_title": job.get("job_title", "").strip(),
            "city": job.get("city", []),
            "category": job.get("category", "General"),
            "avg_salary": job.get("avg_salary", 500000),
            "skills_required": job.get("skills_required", []),
            "entry_requirements": job.get("entry_requirements"),
            "career_path_summary": job.get("career_path_summary"),
            "top_companies": job.get("top_companies", []),
            "demand_level": job.get("demand_level", "Medium"),
            "duration_to_employable": job.get("duration_to_employable"),
            "image_url": job.get("image_url"),
            "status": "published",
            "source": "seed_migration",
            "confidence_score": 1.0,
            "updated_at": utc_now().isoformat()
        }
        await db.jobs.update_one(
            {"job_id": job_id},
            {"$set": doc, "$setOnInsert": {"created_at": utc_now().isoformat()}},
            upsert=True
        )
        results["jobs_upserted"] += 1

    # 2. Skills Migration
    skills_data = load_json_file("data_skills.json")
    for skill in skills_data:
        skill_id = skill.get("skill_id")
        if not skill_id:
            continue
        doc = {
            "skill_id": skill_id,
            "skill_name": skill.get("skill_name", "").strip(),
            "category": skill.get("category", "General"),
            "difficulty_level": skill.get("difficulty_level", "Intermediate"),
            "relevant_roles": skill.get("relevant_roles", []),
            "certification_available": skill.get("certification_available", False),
            "description": skill.get("description"),
            "avg_learning_duration": skill.get("avg_learning_duration"),
            "tools_related": skill.get("tools_related", []),
            "source_links": skill.get("source_links", []),
            "status": "published",
            "source": "seed_migration",
            "updated_at": utc_now().isoformat()
        }
        await db.skills.update_one(
            {"skill_id": skill_id},
            {"$set": doc, "$setOnInsert": {"created_at": utc_now().isoformat()}},
            upsert=True
        )
        results["skills_upserted"] += 1

    # 3. Courses Migration (All 40 Courses & Certifications)
    courses_data = load_json_file("data_courses.json")
    for course in courses_data:
        course_id = course.get("course_id")
        if not course_id:
            continue
        doc = {
            "course_id": course_id,
            "course_name": course.get("course_name", "").strip(),
            "type": course.get("type", "Certificate"),
            "institution": course.get("institution", "Unknown"),
            "mode": course.get("mode", "Online"),
            "duration": course.get("duration"),
            "fees": course.get("fees", 0.0),
            "skills_covered": course.get("skills_covered", []),
            "career_roles": course.get("career_roles", []),
            "city": course.get("city"),
            "link": course.get("link"),
            "rating": course.get("rating", 4.0),
            "description": course.get("description"),
            "status": "published",
            "source": "seed_migration",
            "updated_at": utc_now().isoformat()
        }
        await db.courses.update_one(
            {"course_id": course_id},
            {"$set": doc, "$setOnInsert": {"created_at": utc_now().isoformat()}},
            upsert=True
        )
        results["courses_upserted"] += 1

    # 4. Colleges Migration (Formal Degree Programs from courses)
    college_candidates = [c for c in courses_data if c.get("type") in ["UG", "PG", "Degree"]]
    for idx, cand in enumerate(college_candidates, start=1):
        college_doc = {
            "college_id": idx,
            "college_name": cand.get("institution", "University"),
            "institution": cand.get("institution", "University"),
            "degree_type": cand.get("type", "UG"),
            "program_name": cand.get("course_name", ""),
            "mode": cand.get("mode", "Offline"),
            "duration": cand.get("duration"),
            "annual_fees": cand.get("fees", 0.0),
            "city": cand.get("city", "All"),
            "skills_covered": cand.get("skills_covered", []),
            "relevant_roles": cand.get("career_roles", []),
            "rating": cand.get("rating", 4.0),
            "description": cand.get("description"),
            "status": "published",
            "source": "seed_migration",
            "updated_at": utc_now().isoformat()
        }
        await db.colleges.update_one(
            {"college_id": idx},
            {"$set": college_doc, "$setOnInsert": {"created_at": utc_now().isoformat()}},
            upsert=True
        )
        results["colleges_upserted"] += 1

    # 5. Interest Mappings Migration
    interest_data = load_json_file("data_interest_matrix.json")
    if isinstance(interest_data, dict):
        for domain, roles in interest_data.items():
            doc = {
                "domain": domain,
                "mapped_roles": roles,
                "category_keywords": [domain.lower()],
                "status": "published",
                "updated_at": utc_now().isoformat()
            }
            await db.interest_mappings.update_one(
                {"domain": domain},
                {"$set": doc},
                upsert=True
            )
            results["interest_mappings_upserted"] += 1

    # 6. Configure Default Data Sources
    default_sources = [
        {
            "source_id": "seed_migration",
            "name": "Sankalp Verified Curated Seed",
            "type": "curated_feed",
            "refresh_frequency": "manual",
            "enabled": True,
            "trust_level": 1.0,
            "auto_publish": True,
            "last_sync_at": utc_now().isoformat(),
            "created_at": utc_now().isoformat()
        },
        {
            "source_id": "manual_admin_upload",
            "name": "Administrative Manual Upload & Editor",
            "type": "manual_upload",
            "refresh_frequency": "manual",
            "enabled": True,
            "trust_level": 1.0,
            "auto_publish": True,
            "last_sync_at": utc_now().isoformat(),
            "created_at": utc_now().isoformat()
        },
        {
            "source_id": "curated_public_feed",
            "name": "Sankalp Dynamic Industry Benchmark Feed",
            "type": "public_api",
            "refresh_frequency": "daily",
            "enabled": True,
            "trust_level": 0.95,
            "auto_publish": True,
            "last_sync_at": utc_now().isoformat(),
            "created_at": utc_now().isoformat()
        }
    ]
    for src in default_sources:
        await db.data_sources.update_one(
            {"source_id": src["source_id"]},
            {"$set": src},
            upsert=True
        )
        results["data_sources_configured"] += 1

    # 7. Record Ingestion Sync Run and Audit Log
    run_log = {
        "run_id": str(uuid.uuid4()),
        "source_id": "seed_migration",
        "source_name": "Sankalp Seed Ingestion Pipeline",
        "status": "completed",
        "fetched_count": (
            results["jobs_upserted"] +
            results["skills_upserted"] +
            results["courses_upserted"] +
            results["interest_mappings_upserted"]
        ),
        "created_count": results["jobs_upserted"] + results["skills_upserted"] + results["courses_upserted"],
        "updated_count": 0,
        "skipped_count": 0,
        "flagged_review_count": 0,
        "error_message": None,
        "started_at": results["started_at"],
        "completed_at": utc_now().isoformat()
    }
    await db.sync_runs.insert_one(run_log)

    audit_entry = {
        "audit_id": str(uuid.uuid4()),
        "action": "migration",
        "collection_name": "all_catalogs",
        "entity_id": "initial_seed",
        "actor": actor,
        "changes": {
            "jobs": results["jobs_upserted"],
            "skills": results["skills_upserted"],
            "courses": results["courses_upserted"],
            "colleges": results["colleges_upserted"],
            "interest_mappings": results["interest_mappings_upserted"]
        },
        "timestamp": utc_now().isoformat()
    }
    await db.audit_logs.insert_one(audit_entry)

    # Invalidate application cache
    cache.invalidate()

    results["completed_at"] = utc_now().isoformat()
    logger.info(f"Migration completed successfully: {results}")
    return results

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv(ROOT_DIR / ".env")
    asyncio.run(run_data_migration(actor="cli:migration_script"))
