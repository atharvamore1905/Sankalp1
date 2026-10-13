# PROJECT SANKALP — DATABASE-FIRST DATA MANAGEMENT & AUTOMATED REFRESH REPORT

**Date:** October 2026  
**System:** Project Sankalp (Jigyasa, Margadarshak, Samarthya, Unnati, Sahyog, Drishtikon)  
**Database:** MongoDB Atlas (`sankalp` database)  
**Deployment Environment:** Vercel Serverless (FastAPI Backend + React Frontend)

---

## 1. Executive Summary

Project Sankalp has been upgraded from static runtime JSON datasets (`data_jobs.json`, `data_skills.json`, `data_courses.json`, `data_interest_matrix.json`) to a centralized, database-driven MongoDB Atlas architecture.

The system now operates with:
1. **MongoDB Atlas as the Single Source of Truth**: All 6 platform modules now query live collections (`jobs`, `skills`, `courses`, `colleges`, `interest_mappings`) with cold-start cache fallbacks.
2. **Deterministic Margadarshak Scoring Engine**: Preserves the exact mathematical scoring formula:
   $$\text{career\_score} = 0.45 \cdot S_{\text{pos}} + 0.15 \cdot S_{\text{course}} + 0.15 \cdot E + 0.15 \cdot I + 0.10 \cdot L$$
   with a 4-stage actionable roadmap structure (`Foundation`, `Learning`, `Projects`, `Job Preparation`).
3. **Automated Ingestion & Refresh Pipeline**: Incorporates source adapters, sync locks to prevent concurrency conflicts, duplicate detection, schema validation, audit logging, and cache invalidation.
4. **Data Control Center Admin Dashboard**: Dual-authenticated administrative console supporting live catalog management, manual sync triggers, status lifecycle governance (`published`, `draft`, `archived`), and audit history tracking.

---

## 2. Collections & Schema Architecture

| Collection Name | Purpose | Key Attributes | Indexes |
|---|---|---|---|
| `jobs` | Career roles catalog | `job_id`, `job_title`, `category`, `avg_salary`, `skills_required`, `demand_level`, `status`, `source` | `job_id` (unique), `status`, `category`, `demand_level` |
| `skills` | Platform skill inventory | `skill_id`, `skill_name`, `category`, `difficulty_level`, `relevant_roles`, `tools_related`, `status` | `skill_id` (unique), `skill_name`, `status`, `category` |
| `courses` | Online courses & bootcamps | `course_id`, `course_name`, `type`, `institution`, `mode`, `fees`, `skills_covered`, `rating` | `course_id` (unique), `status`, `type` |
| `colleges` | Degree programs & institutions | `college_id`, `college_name`, `degree_type`, `program_name`, `mode`, `annual_fees`, `city` | `college_id` (unique), `status` |
| `interest_mappings` | Domain-to-roles matrix | `domain`, `mapped_roles`, `category_keywords`, `status` | `domain` (unique) |
| `data_sources` | Ingestion source registry | `source_id`, `name`, `type`, `refresh_frequency`, `trust_level`, `auto_publish` | `source_id` (unique) |
| `sync_runs` | Ingestion run audit logs | `run_id`, `source_id`, `status`, `fetched_count`, `created_count`, `updated_count`, `timestamps` | `run_id` (unique), `started_at` |
| `audit_logs` | Admin mutation history | `audit_id`, `action`, `collection_name`, `entity_id`, `actor`, `changes`, `timestamp` | `timestamp`, `(collection_name, entity_id)` |
| `users` *(Preserved)* | User accounts & bcrypt hashes | `id`, `name`, `email`, `phone_no`, `password_hash`, `created_at` | Preserved intact |
| `progress_items` *(Preserved)* | Unnati roadmap tracking items | `id`, `user_id`, `title`, `type`, `status`, `percent_complete`, `due_date` | Preserved intact |
| `community_posts` *(Preserved)* | Sahyog forum discussions | `post_id`, `title`, `content`, `type`, `author`, `created_at` | Preserved intact |

---

## 3. Module Integrations

- **Jigyasa**: Reads `/api/jigyasa/colleges`, `/api/jigyasa/skills`, and `/api/jigyasa/jobs` directly from MongoDB with in-memory caching and real-time filtering by category, search text, city, and difficulty.
- **Margadarshak**: Computes recommendations deterministically using candidate academic metrics, missing skill course coverage, and MongoDB interest mappings. Emits a structured 4-stage roadmap and persists AI counselor sessions in `margadarshak_chats`.
- **Samarthya**: Matches user profiles against MongoDB `jobs` in real-time, calculating exact intersection and gap analysis percentages.
- **Unnati**: Preserves all user progress tracking and imported roadmaps directly in `progress_items`.
- **Drishtikon**: Aggregates live salary trends, emerging skill frequencies, and demand distributions directly from MongoDB `jobs`.
- **Sahyog**: Forum questions, resources, and mentor requests continue to be stored and served from MongoDB Atlas.

---

## 4. Ingestion & Refresh Architecture

```
External/Curated Feeds  OR  Admin Upload
                 │
                 ▼
      BaseSourceAdapter.fetch()
                 │
                 ▼
          IngestionPipeline
   [Concurreny Sync Lock Acquired]
                 │
                 ├─► Pydantic Model Validation
                 ├─► Title / ID Deduplication
                 ├─► Trust Level & Auto-Publish Routing
                 ├─► Upsert into MongoDB Collections
                 ├─► Record AuditLog & SyncRun
                 └─► Invalidate TTL Cache (300s)
                 │
                 ▼
   Platform Modules Immediately Fresh
```

---

## 5. Security & Governance

- **Authentication**: Admin access utilizes dual token validation:
  1. HTTPOnly `sankalp_admin_token` cookie for web security.
  2. `Authorization: Bearer <token>` fallback header stored in `localStorage` for cross-origin and third-party cookie resilience.
- **Data Protection**: Zero hardcoded credentials or database URIs in source code.
- **Idempotence**: Database migration and ingestion runs execute via `$set` and `$setOnInsert` operations, ensuring repeated runs never wipe or corrupt existing records or user progress.
