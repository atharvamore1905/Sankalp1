import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
import uuid

from db import get_db, cache
from models import (
    JobModel, SkillModel, CourseModel, CollegeModel,
    SyncRunModel, AuditLogModel, utc_now
)

logger = logging.getLogger("sankalp.ingestion")

# Concurrency lock to prevent overlapping sync runs
_sync_lock = asyncio.Lock()


# ----------------- Source Adapters -----------------

class BaseSourceAdapter(ABC):
    def __init__(self, source_id: str, name: str, trust_level: float = 1.0, auto_publish: bool = True):
        self.source_id = source_id
        self.name = name
        self.trust_level = trust_level
        self.auto_publish = auto_publish

    @abstractmethod
    async def fetch(self) -> Dict[str, List[Dict[str, Any]]]:
        """Fetch raw data payload returning dict with keys: 'jobs', 'skills', 'courses', 'colleges'."""
        pass


class ManualUploadAdapter(BaseSourceAdapter):
    def __init__(self, payload: Dict[str, List[Dict[str, Any]]], admin_email: str, auto_publish: bool = True):
        super().__init__(
            source_id="manual_admin_upload",
            name=f"Manual Admin Upload ({admin_email})",
            trust_level=1.0,
            auto_publish=auto_publish
        )
        self.payload = payload

    async def fetch(self) -> Dict[str, List[Dict[str, Any]]]:
        return self.payload


class CuratedPublicFeedAdapter(BaseSourceAdapter):
    def __init__(self):
        super().__init__(
            source_id="curated_public_feed",
            name="Sankalp Curated Market & Education Feed",
            trust_level=0.95,
            auto_publish=True
        )

    async def fetch(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Simulates dynamic, refreshed industry benchmark metrics
        (e.g. updated market demand levels, emerging skills, salary adjustments).
        """
        updated_jobs = [
            {
                "job_title": "AI Solutions Architect",
                "category": "Artificial Intelligence",
                "avg_salary": 1850000,
                "skills_required": ["Python", "TensorFlow", "PyTorch", "System Design", "Cloud Infrastructure"],
                "demand_level": "High",
                "city": ["Mumbai", "Pune", "Bengaluru"],
                "entry_requirements": "UG/PG in CS/IT with AI/ML systems experience",
                "career_path_summary": "ML Engineer → AI Architect → Head of AI",
                "top_companies": ["TCS", "Accenture", "Persistent Systems"],
                "duration_to_employable": "9-12 months"
            },
            {
                "job_title": "GenAI Application Developer",
                "category": "Artificial Intelligence",
                "avg_salary": 1400000,
                "skills_required": ["Python", "LangChain", "Vector Databases", "REST APIs", "Prompt Engineering"],
                "demand_level": "High",
                "city": ["Pune", "Mumbai"],
                "entry_requirements": "UG in any tech discipline; portfolio of LLM apps",
                "career_path_summary": "Software Dev → GenAI Developer → AI Tech Lead",
                "top_companies": ["Infosys", "Wipro", "Tech Mahindra"],
                "duration_to_employable": "4-6 months"
            }
        ]

        updated_skills = [
            {
                "skill_name": "Generative AI & LLMs",
                "category": "AI / ML",
                "difficulty_level": "Intermediate",
                "relevant_roles": ["GenAI Application Developer", "AI Solutions Architect", "Machine Learning Engineer"],
                "certification_available": True,
                "description": "Techniques and architectures behind Large Language Models, embeddings, and prompt optimization.",
                "avg_learning_duration": "2-3 months",
                "tools_related": ["Gemini", "LangChain", "Hugging Face"],
                "source_links": ["https://ai.google.dev"]
            }
        ]

        return {
            "jobs": updated_jobs,
            "skills": updated_skills,
            "courses": [],
            "colleges": []
        }


# ----------------- Ingestion Pipeline -----------------

class IngestionPipeline:
    def __init__(self, adapter: BaseSourceAdapter, actor: str = "system:pipeline"):
        self.adapter = adapter
        self.actor = actor

    async def run(self) -> SyncRunModel:
        if _sync_lock.locked():
            logger.warning(f"Sync already in progress. Rejecting overlapping sync for {self.adapter.source_id}")
            return SyncRunModel(
                source_id=self.adapter.source_id,
                source_name=self.adapter.name,
                status="skipped",
                error_message="Another sync is currently in progress."
            )

        async with _sync_lock:
            run_log = SyncRunModel(
                source_id=self.adapter.source_id,
                source_name=self.adapter.name,
                status="running"
            )

            db = get_db()
            if db is not None:
                try:
                    await db.sync_runs.insert_one(run_log.model_dump())
                except Exception as e:
                    logger.warning(f"Could not persist initial sync run: {e}")

            try:
                raw_payload = await self.adapter.fetch()
                total_fetched = 0
                created_count = 0
                updated_count = 0
                skipped_count = 0
                flagged_count = 0

                # 1. Process Jobs
                raw_jobs = raw_payload.get("jobs", [])
                total_fetched += len(raw_jobs)
                for item in raw_jobs:
                    res = await self._process_job(item, db)
                    if res == "created": created_count += 1
                    elif res == "updated": updated_count += 1
                    elif res == "flagged": flagged_count += 1
                    else: skipped_count += 1

                # 2. Process Skills
                raw_skills = raw_payload.get("skills", [])
                total_fetched += len(raw_skills)
                for item in raw_skills:
                    res = await self._process_skill(item, db)
                    if res == "created": created_count += 1
                    elif res == "updated": updated_count += 1
                    elif res == "flagged": flagged_count += 1
                    else: skipped_count += 1

                # 3. Process Courses
                raw_courses = raw_payload.get("courses", [])
                total_fetched += len(raw_courses)
                for item in raw_courses:
                    res = await self._process_course(item, db)
                    if res == "created": created_count += 1
                    elif res == "updated": updated_count += 1
                    elif res == "flagged": flagged_count += 1
                    else: skipped_count += 1

                # 4. Process Colleges
                raw_colleges = raw_payload.get("colleges", [])
                total_fetched += len(raw_colleges)
                for item in raw_colleges:
                    res = await self._process_college(item, db)
                    if res == "created": created_count += 1
                    elif res == "updated": updated_count += 1
                    elif res == "flagged": flagged_count += 1
                    else: skipped_count += 1

                run_log.status = "completed"
                run_log.fetched_count = total_fetched
                run_log.created_count = created_count
                run_log.updated_count = updated_count
                run_log.skipped_count = skipped_count
                run_log.flagged_review_count = flagged_count
                run_log.completed_at = utc_now()

                # Invalidate application cache on completion
                cache.invalidate()

                if db is not None:
                    await db.sync_runs.update_one(
                        {"run_id": run_log.run_id},
                        {"$set": run_log.model_dump()}
                    )

                logger.info(f"Sync run {run_log.run_id} finished successfully: {created_count} created, {updated_count} updated.")
                return run_log

            except Exception as e:
                logger.error(f"Sync run failed: {e}", exc_info=True)
                run_log.status = "failed"
                run_log.error_message = str(e)
                run_log.completed_at = utc_now()

                if db is not None:
                    try:
                        await db.sync_runs.update_one(
                            {"run_id": run_log.run_id},
                            {"$set": run_log.model_dump()}
                        )
                    except Exception:
                        pass
                return run_log

    async def _process_job(self, item: Dict[str, Any], db: Any) -> str:
        if db is None:
            return "skipped"

        title = item.get("job_title", "").strip()
        if not title:
            return "skipped"

        # Check existing by job_id or case-insensitive title
        existing = await db.jobs.find_one({
            "$or": [
                {"job_id": item.get("job_id")},
                {"job_title": {"$regex": f"^{title}$", "$options": "i"}}
            ]
        })

        status = "published" if (self.adapter.auto_publish and self.adapter.trust_level >= 0.8) else "pending_review"

        if existing:
            # Update existing
            job_id = existing["job_id"]
            update_data = {
                "avg_salary": item.get("avg_salary", existing.get("avg_salary")),
                "demand_level": item.get("demand_level", existing.get("demand_level")),
                "skills_required": list(set(existing.get("skills_required", []) + item.get("skills_required", []))),
                "updated_at": utc_now().isoformat()
            }
            if self.adapter.trust_level >= 0.9:
                update_data["source"] = self.adapter.source_id

            await db.jobs.update_one({"job_id": job_id}, {"$set": update_data})
            await self._audit("update", "jobs", str(job_id), update_data, db)
            return "updated"
        else:
            # Create new
            highest = await db.jobs.find_one(sort=[("job_id", -1)])
            next_id = (highest.get("job_id", 0) + 1) if highest else 1
            item["job_id"] = next_id
            item["status"] = status
            item["source"] = self.adapter.source_id
            item["created_at"] = utc_now().isoformat()
            item["updated_at"] = utc_now().isoformat()

            await db.jobs.insert_one(item)
            await self._audit("create", "jobs", str(next_id), item, db)
            return "created" if status == "published" else "flagged"

    async def _process_skill(self, item: Dict[str, Any], db: Any) -> str:
        if db is None:
            return "skipped"

        name = item.get("skill_name", "").strip()
        if not name:
            return "skipped"

        existing = await db.skills.find_one({
            "$or": [
                {"skill_id": item.get("skill_id")},
                {"skill_name": {"$regex": f"^{name}$", "$options": "i"}}
            ]
        })

        status = "published" if (self.adapter.auto_publish and self.adapter.trust_level >= 0.8) else "pending_review"

        if existing:
            skill_id = existing["skill_id"]
            update_data = {
                "category": item.get("category", existing.get("category")),
                "difficulty_level": item.get("difficulty_level", existing.get("difficulty_level")),
                "tools_related": list(set(existing.get("tools_related", []) + item.get("tools_related", []))),
                "updated_at": utc_now().isoformat()
            }
            await db.skills.update_one({"skill_id": skill_id}, {"$set": update_data})
            await self._audit("update", "skills", str(skill_id), update_data, db)
            return "updated"
        else:
            highest = await db.skills.find_one(sort=[("skill_id", -1)])
            next_id = (highest.get("skill_id", 0) + 1) if highest else 1
            item["skill_id"] = next_id
            item["status"] = status
            item["source"] = self.adapter.source_id
            item["created_at"] = utc_now().isoformat()
            item["updated_at"] = utc_now().isoformat()

            await db.skills.insert_one(item)
            await self._audit("create", "skills", str(next_id), item, db)
            return "created" if status == "published" else "flagged"

    async def _process_course(self, item: Dict[str, Any], db: Any) -> str:
        if db is None:
            return "skipped"

        name = item.get("course_name", "").strip()
        if not name:
            return "skipped"

        existing = await db.courses.find_one({
            "$or": [
                {"course_id": item.get("course_id")},
                {"course_name": {"$regex": f"^{name}$", "$options": "i"}}
            ]
        })

        status = "published" if (self.adapter.auto_publish and self.adapter.trust_level >= 0.8) else "pending_review"

        if existing:
            course_id = existing["course_id"]
            update_data = {
                "fees": item.get("fees", existing.get("fees")),
                "rating": item.get("rating", existing.get("rating")),
                "updated_at": utc_now().isoformat()
            }
            await db.courses.update_one({"course_id": course_id}, {"$set": update_data})
            await self._audit("update", "courses", str(course_id), update_data, db)
            return "updated"
        else:
            highest = await db.courses.find_one(sort=[("course_id", -1)])
            next_id = (highest.get("course_id", 0) + 1) if highest else 1
            item["course_id"] = next_id
            item["status"] = status
            item["source"] = self.adapter.source_id
            item["created_at"] = utc_now().isoformat()
            item["updated_at"] = utc_now().isoformat()

            await db.courses.insert_one(item)
            await self._audit("create", "courses", str(next_id), item, db)
            return "created" if status == "published" else "flagged"

    async def _process_college(self, item: Dict[str, Any], db: Any) -> str:
        if db is None:
            return "skipped"

        name = item.get("college_name") or item.get("institution", "").strip()
        if not name:
            return "skipped"

        existing = await db.colleges.find_one({
            "$or": [
                {"college_id": item.get("college_id")},
                {"college_name": {"$regex": f"^{name}$", "$options": "i"}}
            ]
        })

        status = "published" if (self.adapter.auto_publish and self.adapter.trust_level >= 0.8) else "pending_review"

        if existing:
            college_id = existing["college_id"]
            update_data = {
                "annual_fees": item.get("annual_fees", existing.get("annual_fees")),
                "updated_at": utc_now().isoformat()
            }
            await db.colleges.update_one({"college_id": college_id}, {"$set": update_data})
            await self._audit("update", "colleges", str(college_id), update_data, db)
            return "updated"
        else:
            highest = await db.colleges.find_one(sort=[("college_id", -1)])
            next_id = (highest.get("college_id", 0) + 1) if highest else 1
            item["college_id"] = next_id
            item["college_name"] = name
            item["status"] = status
            item["source"] = self.adapter.source_id
            item["created_at"] = utc_now().isoformat()
            item["updated_at"] = utc_now().isoformat()

            await db.colleges.insert_one(item)
            await self._audit("create", "colleges", str(next_id), item, db)
            return "created" if status == "published" else "flagged"

    async def _audit(self, action: str, collection: str, entity_id: str, changes: Dict[str, Any], db: Any):
        if db is None:
            return
        try:
            audit = AuditLogModel(
                action=action,
                collection_name=collection,
                entity_id=entity_id,
                actor=self.actor,
                changes={k: str(v) for k, v in changes.items() if k != "_id"}
            )
            await db.audit_logs.insert_one(audit.model_dump())
        except Exception as e:
            logger.warning(f"Failed to record audit log: {e}")
