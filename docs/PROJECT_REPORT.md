# Warehouse Bolt – Project Report

Date: 2025-10-24  
Repository: `123DS9472396/warehouse-bolt` (branch: `temp-clean`)

## Executive Summary

Warehouse Bolt is a full‑stack application for discovering, listing, and operating storage/warehouse spaces. The project migrated from a local-only demo to a production‑ready Supabase/Postgres backend with:

- A proper owner submission → admin approval workflow
- Idempotent, RLS‑aware SQL migrations for Supabase
- Local file uploads via MinIO with a presign server; production via S3
- A hybrid recommendation engine (KNN + RandomForest) with fallbacks and explainability
- A dark‑first React UI built with Vite, Tailwind, and Radix UI components

This report documents architecture, data model, ML, APIs, setup, and operational guidance.

---

## Architecture Overview

- Frontend: React 18 + TypeScript + Vite (SPA)
  - State/data fetch: TanStack Query
  - UI: Tailwind CSS, Radix primitives, dark‑first theme
- Backend: Node.js + Express (custom server)
  - API routes mounted in `server/index.ts`
  - Recommendation orchestration in `server/routes/recommend.ts`
  - Approval endpoint in `server/routes/approveSubmission.ts`
  - Diagnostic routes under `server/routes/debug.ts`
- Database: Supabase (PostgreSQL)
  - Core table: `warehouses`
  - New workflow table: `warehouse_submissions` (pending approvals)
  - RLS policies across all tables; service role key used by server
  - Additional seeker/booking/reviews tables for end‑to‑end UX
- Storage:
  - Local: MinIO via `docker-compose.minio.yml` + presign server (`tools/minio-presign-server/`)
  - Production: S3 presign server (`tools/s3-presign-server/`)
- ML: `shared/ml-algorithms.ts` provides KNN, RandomForest, and Hybrid ensemble
  - Server fetches filtered candidate set from Supabase, then ranks locally

### Data flow (high‑level)

1) Owner submits a property → row inserted into `warehouse_submissions` with status `pending`.  
2) Admin reviews in UI → calls `/api/approve-submission` → server updates status to `approved`.  
3) A DB trigger (planned) or service flow creates a row in `warehouses` referencing the submission.  
4) Seekers query `/api/recommend` with preferences → server fetches candidate rows from `warehouses`, ranks via Hybrid ML, returns top‑N with explanations.  
5) File uploads use presigned URLs; client uploads directly to MinIO/S3; resulting public URL is saved in the submission/warehouse record.

---

## Tech Stack

- React 18, TypeScript 5, Vite 6
- Tailwind CSS, Radix UI, TanStack Query
- Node.js 18+, Express 4
- Supabase JS SDK v2 (service‑role key on server)
- MinIO/S3 for object storage; presign servers for secure uploads
- Vitest for testing; Prettier for formatting

---

## Features

- Owner listing flow (images, documents, metadata) → admin approval → publish to catalog
- Seeker discovery with filters and ML‑powered recommendations
- Hybrid recommender (KNN + RandomForest) with reason strings for explainability
- Dark‑first UI with professional cards, amenity badges, and responsive layout
- Local development storage via Docker (MinIO + presign) and production S3 option

---

## Database Model & Migrations

Key files:
- `supabase/migrations/20251002100000_create_warehouses_full.sql` – Full `warehouses` schema + RLS + indexes (idempotent)
- `database/warehouse_submissions.sql` – Pending submissions table + notifications + RLS + indexes (idempotent)
- `supabase/migrations/20251003000000_create_seeker_tables.sql` – Seeker profiles, bookings, reviews, etc. (idempotent)

Highlights:
- Idempotency: Uses `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`; safe to re‑run
- RLS: Enabled on `warehouses`, `warehouse_submissions`, and related tables with focused policies
- Performance: Indexes on city, district, status, price, rating; owner/status on submissions
- Approval linkage: `warehouses` extended with `submission_id`, `owner_id`, `approved_at`, `approved_by`
- Trigger utility: `update_updated_at_column()` and triggers to maintain timestamps

Approval path: On admin approval, a trigger or service flow should insert a normalized `warehouses` row from the approved submission and set `source_submission_id`/`submission_id`. The `server/routes/approveSubmission.ts` polls for this row after flipping status to `approved`.

---

## Storage & File Uploads

- Local: Bring up MinIO and a presign server via `docker-compose.minio.yml`.
  - Presign server mounts `tools/minio-presign-server/` and exposes `POST /presign`.
  - Use the returned `uploadUrl` for a direct PUT; store the provided `publicUrl` in Supabase.
- Production: Use the AWS S3 presign server in `tools/s3-presign-server/`.

Client integration: `client/pages/ListProperty.tsx` calls `usePresignedUpload` and stores canonical URLs in submissions.

---

## Recommendation System

- Algorithms: KNN (distance‑based similarity), RandomForest (feature‑based scoring), and a Hybrid ensemble that normalizes and combines scores for robustness.
- Server flow (`server/routes/recommend.ts`):
  - Fetches candidates from Supabase with server‑side filters:
    - `district` partial match via `city.ilike` OR `district.ilike`
    - Price window around `targetPrice`
    - `total_area >= minAreaSqft`
  - Paginates up to a cap (`MAX_CANDIDATES`) to protect memory
  - Falls back to a relaxed fetch, then to mock data if needed
  - Runs Hybrid by default; `?algorithm=gemini` optionally tries LLM path with fallback
  - Adds `X-Recommendation-Algorithm` header for traceability
- Types shared via `shared/api.ts`.

---

## API Endpoints

Base URL (dev): `http://localhost:3000`

- Health
  - `GET /api/health` → `{ ok: true }`
- Recommendations
  - `POST /api/recommend?algorithm=hybrid|gemini`
  - Body: `{ preferences: { district?: string; targetPrice?: number; minAreaSqft?: number; preferredType?: string; preferVerified?: boolean; preferAvailability?: boolean }, limit?: number }`
  - Response: `{ items: RecommendedWarehouse[] }` (see `shared/api.ts`)
- Approval
  - `POST /api/approve-submission` (server must have `SUPABASE_SERVICE_ROLE`)
  - Body: `{ submissionId: string }`
  - Response: `{ warehouseId: string | null }` (polls for creation by DB trigger/service)
- Debug
  - `GET /api/debug/warehouses-sample` → `{ count, sample: [{ id, name, city, district, price_per_sqft, total_area }] }`

---

## Environment Configuration

Create a `.env` at project root with at least:

- Supabase
  - `SUPABASE_URL=...`
  - `SUPABASE_ANON_KEY=...` (client)  
  - `SUPABASE_SERVICE_ROLE=...` (server; required for approval/policies)
- Presign server (dev)
  - `PRESIGN_SERVER_URL=http://localhost:4001` (example)
- MinIO (compose provides defaults)
  - `MINIO_ROOT_USER=minioadmin`
  - `MINIO_ROOT_PASSWORD=minioadmin123`

Ensure the server process sees `SUPABASE_SERVICE_ROLE`; the client should only use the anon key.

---

## Local Development

Requirements: Node.js 18+, Docker Desktop (for MinIO), PowerShell on Windows.

### 1) Install deps

```powershell
npm install
```

### 2) Type check (optional)

```powershell
npm run typecheck
```

### 3) Start dev server

```powershell
npm run dev:server
```

- Server listens on `http://localhost:3000`.
- Verify:
  - `Invoke-RestMethod http://localhost:3000/api/health`
  - `Invoke-RestMethod http://localhost:3000/api/debug/warehouses-sample`

### 4) Run client (if separate, via Vite) – optional

```powershell
npm run dev
```

### 5) Start MinIO + presign (optional for local uploads)

```powershell
# From project root
docker compose -f docker-compose.minio.yml up --build
```

### 6) Smoke test recommendations

```powershell
$body = @{ preferences = @{ district = "Thane"; targetPrice = 5.5; minAreaSqft = 500 }; limit = 10 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/recommend" -Body $body -ContentType 'application/json'
```

---

## Production Notes

- Use the S3 presign server under `tools/s3-presign-server/` and configure AWS credentials via environment variables.
- Keep service‑role keys strictly on the server; never expose to the client.
- Ensure RLS policies match the intended access model; use `EXPLAIN` and logs to verify.

---

## Testing & Quality Gates

- Typecheck: `npm run typecheck`
- Unit/Integration (where applicable): `npm test`
- Lint/Format: `npm run format.fix`

Quality gates target PASS for typecheck and tests before deployment. Use the debug route and health checks to validate runtime status.

---

## Troubleshooting

- Port conflicts on Windows (3000)
  - Identify listener: `netstat -ano | findstr :3000`
  - Kill process: `Stop-Process -Id <PID> -Force`
- PowerShell curl differences
  - Prefer `Invoke-RestMethod` or `curl.exe` for JSON posts
- Supabase anon key limits
  - Missing `SUPABASE_SERVICE_ROLE` can block approval/admin routes; set it on server and restart

---

## Roadmap / Open Items

- Bring up Compose (MinIO + presign) locally and validate upload hook end‑to‑end
- Fix React `forwardRef` warnings on a few Radix‑wrapped components
- Copy polish (rename lingering “Gemini” labels to “Hybrid” where applicable)
- Validate end‑to‑end approval flow with service role key present in server env
- Final typecheck/test/lint and push to main or open PR

---

## Key Files Reference

- Backend
  - `server/index.ts` – Express app, routes mount
  - `server/routes/recommend.ts` – Core recommender handler
  - `server/routes/approveSubmission.ts` – Admin approval flow
  - `server/routes/debug.ts` – Diagnostics/sample data
- Shared
  - `shared/api.ts` – Types shared across client/server
  - `shared/ml-algorithms.ts` – KNN, RF, Hybrid ensemble and mappers
- Client
  - `client/pages/ListProperty.tsx` – Submission + uploads
  - `client/pages/MLRecommendationsPage.tsx` – ML recommendations UI
  - `client/components/Navbar.tsx`, `client/global.css` – Dark‑first theme
- Data/DB
  - `supabase/migrations/*.sql` – Idempotent migrations for core schema
  - `database/warehouse_submissions.sql` – Pending submissions + RLS
- Storage
  - `docker-compose.minio.yml` – Local MinIO + presign
  - `tools/minio-presign-server/` – Dev presign server
  - `tools/s3-presign-server/` – Prod presign server

---

## How to export this report to PDF

- In VS Code: open this file, right‑click → “Print…” and select “Save as PDF”; or use a Markdown‑to‑PDF extension.
- Alternatively, run a converter like `pandoc` or your preferred Markdown exporter.

---

© 2025 Warehouse Bolt. Documentation generated for branch `temp-clean` on 2025‑10‑24.
