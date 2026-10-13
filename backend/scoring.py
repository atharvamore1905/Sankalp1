import logging
from typing import Dict, Any, List, Optional
from db import fetch_jobs_from_db, fetch_skills_from_db, fetch_courses_from_db, fetch_interest_mappings_from_db

logger = logging.getLogger("sankalp.scoring")

def calculate_academic_eligibility(
    marks_10th: float = 75.0,
    marks_12th: float = 75.0,
    gpa: float = 7.0,
    backlogs: int = 0
) -> float:
    """
    Calculate deterministic academic eligibility score E on a 0-10 scale.
    """
    if marks_12th >= 80:
        base_score = 7.5
    elif marks_12th >= 60:
        base_score = 6.0
    elif marks_12th >= 40:
        base_score = 4.0
    else:
        base_score = 2.0

    # 10th standard weight
    if marks_10th >= 85:
        base_score += 1.0
    elif marks_10th >= 65:
        base_score += 0.5

    # GPA weight
    if gpa >= 8.5:
        base_score += 1.5
    elif gpa >= 7.0:
        base_score += 1.0
    elif gpa >= 6.0:
        base_score += 0.5

    # Backlogs penalty
    if backlogs > 3:
        base_score -= 2.0
    elif backlogs > 0:
        base_score -= 1.0

    return max(0.0, min(10.0, round(base_score, 2)))


def calculate_interest_score(
    domain: str,
    job: Dict[str, Any],
    interest_mappings: Dict[str, List[str]]
) -> float:
    """
    Calculate interest alignment score I (0-10) using MongoDB interest mappings.
    """
    domain_clean = (domain or "").strip().lower()
    job_title = job.get("job_title", "").lower()
    job_category = job.get("category", "").lower()

    if not domain_clean:
        return 5.0

    # 1. Direct match in interest mappings
    for mapped_domain, roles in interest_mappings.items():
        if domain_clean in mapped_domain.lower() or mapped_domain.lower() in domain_clean:
            for role in roles:
                if role.lower() == job_title or role.lower() in job_title or job_title in role.lower():
                    return 10.0
            if any(domain_clean in r.lower() for r in roles):
                return 8.5

    # 2. Category match
    if domain_clean in job_category or any(w in job_category for w in domain_clean.split()):
        return 8.0

    # 3. Title keyword match
    if any(w in job_title for w in domain_clean.split() if len(w) > 3):
        return 7.0

    return 3.5


def calculate_skill_possession_score(
    user_skills: List[str],
    job_required_skills: List[str]
) -> float:
    """
    Calculate skill possession score S_pos (0-10).
    """
    if not job_required_skills:
        return 6.0
    if not user_skills:
        # Neutral baseline when user hasn't declared skills in recommendation form
        return 5.0

    user_skills_lower = {s.strip().lower() for s in user_skills if s}
    job_skills_lower = [s.strip().lower() for s in job_required_skills if s]

    matched = sum(1 for js in job_skills_lower if js in user_skills_lower)
    ratio = matched / len(job_skills_lower)
    return round(ratio * 10.0, 2)


def calculate_course_coverage_score(
    missing_skills: List[str],
    available_courses: List[Dict[str, Any]]
) -> float:
    """
    Calculate course coverage score S_course (0-10) based on MongoDB courses.
    """
    if not missing_skills:
        return 10.0

    missing_lower = {s.lower() for s in missing_skills}
    covered_skills = set()

    for c in available_courses:
        skills_covered = [s.lower() for s in c.get("skills_covered", [])]
        for sk in skills_covered:
            if sk in missing_lower:
                covered_skills.add(sk)

    ratio = len(covered_skills) / len(missing_lower) if missing_lower else 1.0
    return round(ratio * 10.0, 2)


def calculate_location_score(
    preferred_city: Optional[str],
    job_cities: List[str]
) -> float:
    """
    Calculate location / remote compatibility score L (0-10).
    """
    if not preferred_city or not job_cities:
        return 8.0  # Flexible default
    
    city_clean = preferred_city.strip().lower()
    if city_clean in ["any", "all", "remote", "flexible"]:
        return 10.0

    for jc in job_cities:
        if city_clean in jc.lower() or jc.lower() in city_clean:
            return 10.0

    return 6.5


async def evaluate_career_recommendations(
    marks_10th: float,
    marks_12th: float,
    gpa: float,
    backlogs: int,
    domain: str,
    user_skills: Optional[List[str]] = None,
    preferred_city: Optional[str] = None
) -> Dict[str, Any]:
    """
    Execute deterministic career evaluation according to Sankalp Margadarshak specification:
    career_score = 0.45 * S_pos + 0.15 * S_course + 0.15 * E + 0.15 * I + 0.10 * L
    """
    jobs = await fetch_jobs_from_db(include_unpublished=False)
    courses = await fetch_courses_from_db(include_unpublished=False)
    interest_mappings = await fetch_interest_mappings_from_db()

    E = calculate_academic_eligibility(marks_10th, marks_12th, gpa, backlogs)
    user_skills_list = user_skills or []

    scored_careers = []
    for job in jobs:
        req_skills = job.get("skills_required", [])
        user_skills_set = {s.lower() for s in user_skills_list}
        missing = [s for s in req_skills if s.lower() not in user_skills_set] if user_skills_list else req_skills

        S_pos = calculate_skill_possession_score(user_skills_list, req_skills)
        S_course = calculate_course_coverage_score(missing, courses)
        I = calculate_interest_score(domain, job, interest_mappings)
        L = calculate_location_score(preferred_city, job.get("city", []))

        # Margadarshak deterministic formula
        career_score = (0.45 * S_pos) + (0.15 * S_course) + (0.15 * E) + (0.15 * I) + (0.10 * L)
        match_percentage = min(100.0, max(10.0, round(career_score * 10.0, 1)))

        scored_careers.append({
            "job": job,
            "score": round(career_score, 2),
            "match_percentage": match_percentage,
            "metrics": {
                "S_pos": S_pos,
                "S_course": S_course,
                "E": E,
                "I": I,
                "L": L
            }
        })

    scored_careers.sort(key=lambda x: (x["score"], x["match_percentage"]), reverse=True)
    top_careers = scored_careers[:3]

    return {
        "academic_score": E,
        "recommendations": top_careers,
        "total_analyzed": len(scored_careers)
    }


async def generate_four_stage_roadmap(
    domain: str,
    target_job_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Generate the 4-Stage Margadarshak Career Roadmap:
    - Stage 1: Foundation (Prerequisites, core concepts, beginner tools)
    - Stage 2: Learning (Specialized courses, core languages & frameworks)
    - Stage 3: Projects (Hands-on portfolio projects, industry implementations)
    - Stage 4: Job Preparation (Interview prep, resume building, certifications, mock tests)
    """
    jobs = await fetch_jobs_from_db(include_unpublished=False)
    courses = await fetch_courses_from_db(include_unpublished=False)

    matching_job = None
    if target_job_id:
        matching_job = next((j for j in jobs if j.get("job_id") == target_job_id), None)

    if not matching_job and domain:
        domain_lower = domain.lower()
        matching_job = next(
            (j for j in jobs if domain_lower in j.get("category", "").lower() or domain_lower in j.get("job_title", "").lower()),
            None
        )

    if not matching_job:
        matching_job = jobs[0] if jobs else {
            "job_id": 1,
            "job_title": "Data Analyst",
            "category": "Data Science",
            "skills_required": ["SQL", "Python", "Excel"]
        }

    required_skills = matching_job.get("skills_required", ["Core Foundations"])
    role_title = matching_job.get("job_title", "Professional")

    # Match courses covering required skills
    relevant_courses = [
        c for c in courses 
        if any(sk.lower() in [s.lower() for s in c.get("skills_covered", [])] for sk in required_skills)
    ]
    if not relevant_courses:
        relevant_courses = courses[:6]

    course_names = [c["course_name"] for c in relevant_courses]

    # Partition skills across 4 stages
    n = len(required_skills)
    s1_skills = required_skills[:max(1, n // 3)]
    s2_skills = required_skills[max(1, n // 3):max(2, 2 * n // 3)] or required_skills[:2]
    s3_skills = required_skills[max(2, 2 * n // 3):] or required_skills[-2:]
    s4_skills = ["Mock Interviews", "System Design & Portfolio", "Technical Assessment"]

    roadmap = {
        "career": role_title,
        "job_id": matching_job.get("job_id"),
        "total_duration_months": 12,
        "stages_count": 4,
        "levels": [
            {
                "level": "Stage 1: Foundation",
                "stage_name": "Foundation",
                "duration_weeks": 8,
                "skills": s1_skills,
                "courses": course_names[:2] if len(course_names) >= 2 else ["Foundational Course"],
                "projects": [f"Basic {role_title} Starter Lab", "Environment & Tooling Setup"],
                "certifications": [course_names[0]] if course_names else ["Foundational Certificate"]
            },
            {
                "level": "Stage 2: Learning",
                "stage_name": "Learning",
                "duration_weeks": 12,
                "skills": s2_skills,
                "courses": course_names[2:4] if len(course_names) >= 4 else (course_names[:1] or ["Specialization Course"]),
                "projects": [f"Industry-standard {role_title} Module", "Real-world Dataset Pipeline"],
                "certifications": [course_names[1]] if len(course_names) > 1 else ["Specialized Certificate"]
            },
            {
                "level": "Stage 3: Projects",
                "stage_name": "Projects",
                "duration_weeks": 10,
                "skills": s3_skills,
                "courses": course_names[4:6] if len(course_names) >= 6 else (course_names[1:2] or ["Advanced Project Workshop"]),
                "projects": [f"Full-scale {role_title} Capstone Project", "Public Open-Source Showcase"],
                "certifications": ["Capstone Completion Certificate"]
            },
            {
                "level": "Stage 4: Job Preparation",
                "stage_name": "Job Preparation",
                "duration_weeks": 6,
                "skills": s4_skills,
                "courses": ["Resume & Portfolio Optimization", "Technical Interview Masterclass"],
                "projects": ["Portfolio Website Deployment", "Target Company Case Study"],
                "certifications": ["Verified Sankalp Career Readiness Badge"]
            }
        ]
    }

    return roadmap
