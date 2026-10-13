import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent / "backend"))

from scoring import (
    calculate_academic_eligibility,
    calculate_interest_score,
    calculate_skill_possession_score,
    calculate_course_coverage_score,
    calculate_location_score,
    evaluate_career_recommendations,
    generate_four_stage_roadmap
)
from ingestion import IngestionPipeline, CuratedPublicFeedAdapter, ManualUploadAdapter
from db import cache, load_seed_json

async def run_tests():
    print("=========================================")
    print("RUNNING SANKALP ARCHITECTURE VERIFICATIONS")
    print("=========================================")

    # Test 1: Academic Eligibility Score (E)
    print("\n[Test 1] Academic Eligibility Determinism...")
    e_high = calculate_academic_eligibility(marks_10th=90, marks_12th=85, gpa=9.0, backlogs=0)
    e_mid = calculate_academic_eligibility(marks_10th=70, marks_12th=65, gpa=7.0, backlogs=1)
    e_low = calculate_academic_eligibility(marks_10th=50, marks_12th=45, gpa=5.0, backlogs=4)
    print(f"  High profile E: {e_high} (expected >= 9.0)")
    print(f"  Mid profile E:  {e_mid} (expected ~ 6.5)")
    print(f"  Low profile E:  {e_low} (expected ~ 2.0)")
    assert e_high > e_mid > e_low, "Academic scoring ordering violation!"
    print("  [PASS] Academic eligibility test passed.")

    # Test 2: Scoring Formula Determinism
    print("\n[Test 2] Deterministic Scoring Evaluation...")
    result = await evaluate_career_recommendations(
        marks_10th=88,
        marks_12th=82,
        gpa=8.5,
        backlogs=0,
        domain="AI / Machine Learning",
        user_skills=["Python", "TensorFlow", "SQL"],
        preferred_city="Mumbai"
    )
    recs = result["recommendations"]
    assert len(recs) == 3, f"Expected 3 top recommendations, got {len(recs)}"
    top = recs[0]
    print(f"  Top recommended role: {top['job']['job_title']} ({top['match_percentage']}%)")
    metrics = top["metrics"]
    expected_score = round(
        0.45 * metrics["S_pos"] + 
        0.15 * metrics["S_course"] + 
        0.15 * metrics["E"] + 
        0.15 * metrics["I"] + 
        0.10 * metrics["L"], 2
    )
    print(f"  Formula Computed Score: {top['score']}, Re-computed: {expected_score}")
    assert abs(top["score"] - expected_score) < 0.05, "Margadarshak formula calculation mismatch!"
    print("  [PASS] Margadarshak scoring formula verified.")

    # Test 3: 4-Stage Roadmap Generation
    print("\n[Test 3] 4-Stage Roadmap Structure...")
    roadmap = await generate_four_stage_roadmap(domain="Data Science / Analytics")
    stages = roadmap["levels"]
    assert len(stages) == 4, f"Expected 4 roadmap stages, got {len(stages)}"
    stage_names = [s.get("stage_name") for s in stages]
    print(f"  Roadmap stages: {stage_names}")
    assert stage_names == ["Foundation", "Learning", "Projects", "Job Preparation"], "Invalid roadmap stage names!"
    for s in stages:
        assert len(s["skills"]) > 0, f"Stage {s['stage_name']} missing skills!"
        assert len(s["courses"]) > 0, f"Stage {s['stage_name']} missing courses!"
        assert len(s["projects"]) > 0, f"Stage {s['stage_name']} missing projects!"
    print("  [PASS] 4-stage roadmap verified.")

    # Test 4: In-Memory TTL Cache & Invalidation
    print("\n[Test 4] TTL Cache Layer...")
    cache.set("test_key", {"data": 123}, ttl_seconds=10)
    assert cache.get("test_key") == {"data": 123}, "Cache retrieval failed!"
    cache.invalidate("test_")
    assert cache.get("test_key") is None, "Cache invalidation failed!"
    print("  [PASS] Cache manager verified.")

    # Test 5: Fallback Datasets
    print("\n[Test 5] Dataset Seeds...")
    jobs_seed = load_seed_json("data_jobs.json")
    skills_seed = load_seed_json("data_skills.json")
    courses_seed = load_seed_json("data_courses.json")
    interests_seed = load_seed_json("data_interest_matrix.json")
    print(f"  Jobs seed count: {len(jobs_seed)}")
    print(f"  Skills seed count: {len(skills_seed)}")
    print(f"  Courses seed count: {len(courses_seed)}")
    print(f"  Interest matrix domains: {len(interests_seed)}")
    assert len(jobs_seed) == 30, f"Expected 30 jobs, got {len(jobs_seed)}"
    assert len(skills_seed) == 20, f"Expected 20 skills, got {len(skills_seed)}"
    assert len(courses_seed) == 40, f"Expected 40 courses, got {len(courses_seed)}"
    assert len(interests_seed) == 11, f"Expected 11 interest domains, got {len(interests_seed)}"
    print("  [PASS] Seed datasets verified.")

    print("\n=========================================")
    print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!")
    print("=========================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
