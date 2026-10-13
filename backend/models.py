from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

# ----------------- Core Catalog Models -----------------

class JobModel(BaseModel):
    job_id: int
    job_title: str
    city: List[str] = Field(default_factory=list)
    category: str
    avg_salary: int
    skills_required: List[str] = Field(default_factory=list)
    entry_requirements: Optional[str] = None
    career_path_summary: Optional[str] = None
    top_companies: List[str] = Field(default_factory=list)
    demand_level: str = "Medium"  # High, Medium, Low-Medium, Low
    duration_to_employable: Optional[str] = None
    image_url: Optional[str] = None
    status: str = "published"  # published, draft, pending_review, archived
    source: str = "curated_catalog"
    confidence_score: float = 1.0
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class SkillModel(BaseModel):
    skill_id: int
    skill_name: str
    category: str
    difficulty_level: str = "Intermediate"  # Beginner, Intermediate, Advanced
    relevant_roles: List[str] = Field(default_factory=list)
    certification_available: bool = False
    description: Optional[str] = None
    avg_learning_duration: Optional[str] = None
    tools_related: List[str] = Field(default_factory=list)
    source_links: List[str] = Field(default_factory=list)
    status: str = "published"  # published, draft, pending_review, archived
    source: str = "curated_catalog"
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class CourseModel(BaseModel):
    course_id: int
    course_name: str
    type: str  # Certificate, Certification, UG, PG
    institution: str
    mode: str = "Online"  # Online, Offline, Online/Exam
    duration: Optional[str] = None
    fees: Optional[float] = 0.0
    skills_covered: List[str] = Field(default_factory=list)
    career_roles: List[str] = Field(default_factory=list)
    city: Optional[str] = None
    link: Optional[str] = None
    rating: Optional[float] = 4.0
    description: Optional[str] = None
    status: str = "published"  # published, draft, pending_review, archived
    source: str = "curated_catalog"
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class CollegeModel(BaseModel):
    college_id: int
    college_name: str
    institution: str
    degree_type: str  # UG, PG, Diploma
    program_name: str
    mode: str = "Offline"
    duration: Optional[str] = None
    annual_fees: Optional[float] = 0.0
    city: Optional[str] = "All"
    skills_covered: List[str] = Field(default_factory=list)
    relevant_roles: List[str] = Field(default_factory=list)
    rating: Optional[float] = 4.0
    description: Optional[str] = None
    status: str = "published"
    source: str = "curated_catalog"
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class InterestMappingModel(BaseModel):
    domain: str
    mapped_roles: List[str] = Field(default_factory=list)
    category_keywords: List[str] = Field(default_factory=list)
    status: str = "published"
    updated_at: datetime = Field(default_factory=utc_now)


# ----------------- Market Insights & Analytics -----------------

class MarketInsightsModel(BaseModel):
    insight_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trending_domains: List[Dict[str, Any]] = Field(default_factory=list)
    salary_insights: Dict[str, Any] = Field(default_factory=dict)
    high_demand_count: int = 0
    top_emerging_skills: List[Dict[str, Any]] = Field(default_factory=list)
    total_jobs_analyzed: int = 0
    generated_at: datetime = Field(default_factory=utc_now)
    source: str = "mongodb_aggregation"


# ----------------- Ingestion & Audit Pipeline Models -----------------

class DataSourceModel(BaseModel):
    source_id: str
    name: str
    type: str  # public_api, manual_upload, curated_feed
    refresh_frequency: str = "daily"  # manual, hourly, daily, weekly
    enabled: bool = True
    trust_level: float = 1.0  # 0.0 - 1.0
    auto_publish: bool = True
    last_sync_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=utc_now)


class SyncRunModel(BaseModel):
    run_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_id: str
    source_name: str
    status: str = "running"  # running, completed, failed, skipped
    fetched_count: int = 0
    created_count: int = 0
    updated_count: int = 0
    skipped_count: int = 0
    flagged_review_count: int = 0
    error_message: Optional[str] = None
    started_at: datetime = Field(default_factory=utc_now)
    completed_at: Optional[datetime] = None


class AuditLogModel(BaseModel):
    audit_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    action: str  # create, update, delete, status_change, ingest, rollback
    collection_name: str
    entity_id: str
    actor: str  # admin email or system:pipeline
    changes: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=utc_now)
