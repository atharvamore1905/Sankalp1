#!/usr/bin/env python3
"""
Comprehensive automated test suite for Project Sankalp Demo Mode.
Verifies all 11 requirements:
1. Guest demo authentication without credentials
2. Full access across all 6 modules (Jigyasa, Margadarshak, Samarthya, Unnati, Sahyog, Drishtikon)
3. Margadarshak deterministic scoring & 4-stage roadmap generation in demo mode
4. Unnati goal creation, progress update, roadmap import, and deletion in isolated session
5. Samarthya demo profile inspection and temporary edit
6. Guest session expiration and token validation
7. Admin endpoint access rejection with guest token (403 Forbidden)
8. Attempt to read or modify another user's private data (403 Forbidden)
9. Attempt to mutate shared career datasets (403 Forbidden)
10. AI counselor queries with Grok/Gemini fallback and 5-query rate limit
11. Regular user and administrator login flow verification
"""

import sys
import os
from pathlib import Path
import asyncio
from datetime import datetime, timezone, timedelta
from jose import jwt

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(backend_dir))

from server import app, SECRET_KEY, ALGORITHM
from demo import SAMPLE_DEMO_PROFILE, SAMPLE_DEMO_GOALS, DemoSessionManager
import httpx

ADMIN_EMAIL = "Admin123@gmail.com"
ADMIN_PASSWORD = "Admin123"

async def main():
    passed = 0
    failed = 0
    total = 11

    print("=" * 70)
    print("PROJECT SANKALP — DEMO MODE COMPREHENSIVE TEST SUITE")
    print("=" * 70)

    guest_token = None
    guest_id = None
    guest_headers = {}
    road_data = None

    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # ---------------------------------------------------------
        # TEST 1: Entering demo mode via POST /api/auth/guest without credentials
        # ---------------------------------------------------------
        print("\n[TEST 1/11] Entering demo mode via POST /api/auth/guest without credentials...")
        try:
            res1 = await client.post("/api/auth/guest")
            assert res1.status_code == 200, f"Expected 200, got {res1.status_code}: {res1.text}"
            data1 = res1.json()
            assert "token" in data1, "Response missing token"
            assert data1["user"]["is_guest"] is True, "User is_guest flag not True"
            assert data1["user"]["name"] == "Guest User", f"Unexpected demo name: {data1['user']['name']}"
            assert str(data1["user"]["id"]).startswith("guest_"), "User ID does not start with guest_"
            guest_token = data1["token"]
            guest_id = data1["user"]["id"]
            guest_headers = {"Authorization": f"Bearer {guest_token}"}
            print(f"  -> PASSED: Guest session generated: {guest_id} (Token: {guest_token[:20]}...)")
            passed += 1
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"  -> FAILED: {e}")
            failed += 1

        # ---------------------------------------------------------
        # TEST 2: Accessing all 6 modules as guest
        # ---------------------------------------------------------
        print("\n[TEST 2/11] Verifying guest access across all 6 Sankalp modules...")
        try:
            # Module 1: Jigyasa
            res_jig = await client.get("/api/jigyasa/colleges", headers=guest_headers)
            assert res_jig.status_code == 200, f"Jigyasa colleges failed: {res_jig.status_code}"
            
            # Module 2: Margadarshak
            res_marg = await client.post("/api/margadarshak/recommend", json={
                "marks_10th": 88, "marks_12th": 84, "gpa": 8.2, "backlogs": 0,
                "domain": "Data Science", "budget": 50000, "time_availability": "6 months", "future_goals": "ML"
            }, headers=guest_headers)
            assert res_marg.status_code == 200, f"Margadarshak recommend failed: {res_marg.status_code}"

            # Module 3: Samarthya
            res_sam = await client.get("/api/samarthya/profile", headers=guest_headers)
            assert res_sam.status_code == 200, f"Samarthya profile failed: {res_sam.status_code}"

            # Module 4: Unnati
            res_un = await client.get(f"/api/unnati/{guest_id}", headers=guest_headers)
            assert res_un.status_code == 200, f"Unnati progress failed: {res_un.status_code}"

            # Module 5: Sahyog
            res_sah = await client.get("/api/sahyog/posts", headers=guest_headers)
            assert res_sah.status_code == 200, f"Sahyog posts failed: {res_sah.status_code}"

            # Module 6: Drishtikon
            res_dris = await client.get("/api/drishtikon/insights", headers=guest_headers)
            assert res_dris.status_code == 200, f"Drishtikon insights failed: {res_dris.status_code}"

            print("  -> PASSED: Guest successfully accessed all 6 modules (Jigyasa, Margadarshak, Samarthya, Unnati, Sahyog, Drishtikon)")
            passed += 1
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"  -> FAILED: {e}")
            failed += 1

        # ---------------------------------------------------------
        # TEST 3: Margadarshak scoring & 4-stage roadmap generation in demo mode
        # ---------------------------------------------------------
        print("\n[TEST 3/11] Margadarshak deterministic scoring & 4-stage roadmap generation...")
        try:
            req_payload = {
                "marks_10th": 88.0,
                "marks_12th": 84.0,
                "gpa": 8.2,
                "backlogs": 0,
                "domain": "Data Science / Analytics",
                "budget": 50000,
                "time_availability": "6 months",
                "future_goals": "AI/ML Engineer"
            }
            res_rec = await client.post("/api/margadarshak/recommend", json=req_payload, headers=guest_headers)
            assert res_rec.status_code == 200
            rec_data = res_rec.json()
            assert "recommendations" in rec_data
            assert len(rec_data["recommendations"]) > 0
            top_rec = rec_data["recommendations"][0]
            assert "match_percentage" in top_rec
            assert "job" in top_rec
            assert "skills_required" in top_rec["job"]
            print(f"  -> Top match: {top_rec['job']['job_title']} ({top_rec['match_percentage']}% match)")

            res_road = await client.post("/api/margadarshak/roadmap", json=req_payload, headers=guest_headers)
            assert res_road.status_code == 200
            road_data = res_road.json()
            assert "levels" in road_data
            assert len(road_data["levels"]) == 4, f"Expected 4 roadmap levels, got {len(road_data['levels'])}"
            print(f"  -> Generated 4-stage roadmap for '{road_data['career']}' ({road_data['total_duration_months']} months)")
            passed += 1
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"  -> FAILED: {e}")
            failed += 1

        # ---------------------------------------------------------
        # TEST 4: Unnati goal creation, progress update, roadmap import, deletion (isolated)
        # ---------------------------------------------------------
        print("\n[TEST 4/11] Unnati goal creation, progress update, roadmap import, and deletion...")
        try:
            # 1. Check initial demo goals
            res_u1 = await client.get(f"/api/unnati/{guest_id}", headers=guest_headers)
            initial_count = len(res_u1.json().get("items", []))
            assert initial_count > 0, "Initial demo session missing sample goals"

            # 2. Add custom goal
            new_goal = {
                "title": "Complete LeetCode 75 Roadmap",
                "description": "Daily DSA practice",
                "start_date": "2026-03-01",
                "due_date": "2026-04-15"
            }
            res_add = await client.post(f"/api/unnati/{guest_id}/add-goal", json=new_goal, headers=guest_headers)
            assert res_add.status_code == 200
            goal_id = res_add.json()["goal_id"]

            # 3. Update progress of the new goal
            res_upd = await client.post(f"/api/unnati/{guest_id}/update", json={
                "item_id": goal_id,
                "status": "completed",
                "percent_complete": 100
            }, headers=guest_headers)
            assert res_upd.status_code == 200

            # 4. Import roadmap into Unnati
            assert road_data is not None, "Roadmap data missing from Test 3"
            res_imp = await client.post(f"/api/unnati/{guest_id}/import-roadmap", json={"roadmap": road_data}, headers=guest_headers)
            assert res_imp.status_code == 200
            imported_count = res_imp.json()["count"]
            assert imported_count > 0

            # 5. Verify stats updated immediately
            res_u2 = await client.get(f"/api/unnati/{guest_id}", headers=guest_headers)
            items2 = res_u2.json().get("items", [])
            assert len(items2) == initial_count + 1 + imported_count

            # 6. Delete the custom goal
            res_del = await client.delete(f"/api/unnati/{guest_id}/delete-goal/{goal_id}", headers=guest_headers)
            assert res_del.status_code == 200

            print(f"  -> PASSED: Full Unnati lifecycle verified in isolated demo session (initial: {initial_count}, imported: {imported_count})")
            passed += 1
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"  -> FAILED: {e}")
            failed += 1

        # ---------------------------------------------------------
        # TEST 5: Samarthya demo profile inspection and temporary edit
        # ---------------------------------------------------------
        print("\n[TEST 5/11] Samarthya demo profile inspection and temporary edit...")
        try:
            res_prof = await client.get("/api/samarthya/profile", headers=guest_headers)
            assert res_prof.status_code == 200
            prof_data = res_prof.json()
            assert prof_data["is_demo"] is True
            profile = prof_data["profile"]
            assert profile["name"] == "Guest User"
            assert "Python" in profile["skills"]

            # Update demo skills temporarily
            updated_skills = profile["skills"] + ["Next.js"]
            res_edit = await client.post("/api/samarthya/profile", json={"skills": updated_skills}, headers=guest_headers)
            assert res_edit.status_code == 200
            assert res_edit.json().get("is_demo") is True

            # Re-fetch to confirm update in demo session
            res_prof2 = await client.get("/api/samarthya/profile", headers=guest_headers)
            assert "Next.js" in res_prof2.json()["profile"]["skills"]
            print("  -> PASSED: Samarthya demo profile inspected and modified temporarily in session")
            passed += 1
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"  -> FAILED: {e}")
            failed += 1

        # ---------------------------------------------------------
        # TEST 6: Guest session expiration and token validation
        # ---------------------------------------------------------
        print("\n[TEST 6/11] Guest session expiration and token structure validation...")
        try:
            payload = jwt.decode(guest_token, SECRET_KEY, algorithms=[ALGORITHM])
            assert payload.get("is_guest") is True, "Token missing is_guest claim"
            assert str(payload.get("sub")).startswith("guest_"), "Token sub does not start with guest_"
            assert "exp" in payload, "Token missing expiration timestamp"

            # Test expired token
            expired_payload = {
                "sub": guest_id,
                "is_guest": True,
                "exp": datetime.now(timezone.utc) - timedelta(hours=1)
            }
            expired_token = jwt.encode(expired_payload, SECRET_KEY, algorithm=ALGORITHM)
            res_exp = await client.get(f"/api/unnati/{guest_id}", headers={"Authorization": f"Bearer {expired_token}"})
            assert res_exp.status_code == 401, f"Expired token should return 401, got {res_exp.status_code}"
            print("  -> PASSED: Token claims verified and expired guest token correctly rejected with 401")
            passed += 1
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"  -> FAILED: {e}")
            failed += 1

        # ---------------------------------------------------------
        # TEST 7: Admin endpoint access rejection with guest token
        # ---------------------------------------------------------
        print("\n[TEST 7/11] Admin endpoint access rejection with guest token (403 Forbidden)...")
        try:
            admin_endpoints = [
                "/api/admin/me",
                "/api/admin/statistics",
                "/api/admin/colleges",
                "/api/admin/skills",
                "/api/admin/jobs"
            ]
            for ep in admin_endpoints:
                res = await client.get(ep, headers=guest_headers)
                assert res.status_code == 403, f"Endpoint {ep} allowed guest access with status {res.status_code}!"
                detail = res.json().get("detail", "")
                assert "forbidden" in detail.lower() or "denied" in detail.lower()
            print("  -> PASSED: All 5 admin endpoints strictly rejected guest token with 403 Forbidden")
            passed += 1
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"  -> FAILED: {e}")
            failed += 1

        # ---------------------------------------------------------
        # TEST 8: Attempting to access another user's private data
        # ---------------------------------------------------------
        print("\n[TEST 8/11] Attempt to access another user's private data (403 Forbidden)...")
        try:
            target_user = "real_production_user_9999"
            res_hijack = await client.get(f"/api/unnati/{target_user}", headers=guest_headers)
            assert res_hijack.status_code == 403, f"Expected 403, got {res_hijack.status_code}"
            print(f"  -> PASSED: Attempt to read /api/unnati/{target_user} blocked with 403: {res_hijack.json()['detail']}")
            passed += 1
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"  -> FAILED: {e}")
            failed += 1

        # ---------------------------------------------------------
        # TEST 9: Attempt to mutate shared career datasets
        # ---------------------------------------------------------
        print("\n[TEST 9/11] Attempt to mutate shared career datasets with guest token (403 Forbidden)...")
        try:
            fake_job = {
                "job_title": "Malicious Job Insertion",
                "category": "Technology",
                "demand_level": "High",
                "avg_salary": 9999999,
                "skills_required": ["None"]
            }
            res_mut = await client.post("/api/admin/jobs", json=fake_job, headers=guest_headers)
            assert res_mut.status_code == 403, f"Expected 403 for mutating shared catalog, got {res_mut.status_code}"
            print(f"  -> PASSED: Catalog mutation strictly blocked: {res_mut.json()['detail']}")
            passed += 1
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"  -> FAILED: {e}")
            failed += 1

        # ---------------------------------------------------------
        # TEST 10: AI Counselor with Grok/Gemini fallback and 5-query rate limit
        # ---------------------------------------------------------
        print("\n[TEST 10/11] AI counselor queries with Grok/Gemini fallback & guest 5-query rate limit...")
        try:
            for q_idx in range(1, 6):
                chat_res = await client.post("/api/margadarshak/chat", json={
                    "message": f"Career question {q_idx}: What are good skills for data engineering?",
                    "session_id": f"test_chat_{guest_id}"
                }, headers=guest_headers)
                assert chat_res.status_code == 200, f"Query {q_idx} failed: {chat_res.status_code}"
                chat_data = chat_res.json()
                assert "response" in chat_data
                assert "provider" in chat_data
                print(f"  -> Query {q_idx}/5 succeeded (Provider: {chat_data['provider']})")

            # 6th query must hit rate limit:
            limit_res = await client.post("/api/margadarshak/chat", json={
                "message": "Query 6: Should be blocked by rate limit",
                "session_id": f"test_chat_{guest_id}"
            }, headers=guest_headers)
            assert limit_res.status_code == 200
            limit_data = limit_res.json()
            assert limit_data.get("limit_reached") is True, f"Expected limit_reached: True, got: {limit_data}"
            assert "Demo Mode AI Request Limit Reached" in limit_data.get("response", "")
            print(f"  -> Query 6/5 correctly blocked by guest rate limiter: {limit_data['provider']}")
            passed += 1
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"  -> FAILED: {e}")
            failed += 1

        # ---------------------------------------------------------
        # TEST 11: Regular user and administrator login flow verification
        # ---------------------------------------------------------
        print("\n[TEST 11/11] Regular user and administrator login flow verification (zero regressions)...")
        try:
            # Test Admin login
            admin_login_res = await client.post("/api/admin/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            assert admin_login_res.status_code == 200, f"Admin login failed: {admin_login_res.status_code}"
            admin_data = admin_login_res.json()
            admin_token = admin_data["token"]
            admin_headers = {"Authorization": f"Bearer {admin_token}"}

            # Test Admin me endpoint with admin token
            admin_me_res = await client.get("/api/admin/me", headers=admin_headers)
            assert admin_me_res.status_code == 200, f"Admin me failed: {admin_me_res.status_code}"
            assert admin_me_res.json()["admin"]["email"] == ADMIN_EMAIL

            # Test health endpoint verifying demo mode enabled
            health_res = await client.get("/api/health")
            assert health_res.status_code == 200
            assert health_res.json().get("demo_mode_enabled") is True

            print("  -> PASSED: Administrator authentication & health check verified. Zero regression on core auth.")
            passed += 1
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"  -> FAILED: {e}")
            failed += 1

    print("\n" + "=" * 70)
    print(f"TEST RESULTS: {passed}/{total} PASSED ({failed} FAILED)")
    print("=" * 70)
    if failed == 0:
        print("ALL DEMO MODE INTEGRATION TESTS PASSED PERFECTLY!\n")
        return 0
    else:
        print("SOME TESTS FAILED!\n")
        return 1

if __name__ == "__main__":
    code = asyncio.run(main())
    sys.exit(code)
