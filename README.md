# Learnova Production Runbook (XAMPP + phpMyAdmin)

This repository contains:

- `edu-backend` (Node.js + Express + MySQL)
- `edu-frontend` (Next.js)

This project is deployed without Docker. The operational baseline assumes:

- XAMPP MySQL service
- phpMyAdmin for schema visibility
- Node.js 20.x

## 1) Environment Setup

### Backend (`edu-backend/.env`)

Copy `edu-backend/.env.example` to `.env` and set real values.

Production-critical values:

- `NODE_ENV=production`
- `SESSION_SECRET=<strong random secret>`
- `SESSION_SECURE=true`
- `SESSION_STORE=mysql`
- `FRONTEND_ORIGINS=https://your-frontend-domain`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

### Frontend (`edu-frontend/.env.local`)

Copy `edu-frontend/.env.local.example` and set:

- `NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain`

## 2) Database Migrations (Manual)

Use phpMyAdmin SQL runner (or MySQL CLI) and apply all files in `edu-backend/scripts/migrations` in filename order.

Example order:

1. `001_*`
2. `002_*`
3. ...

Validate migration naming before release:

```bash
cd edu-backend
npm run migrations:validate
```

Critical migration requirement:

- `006_enforce_linkage_and_selection_invariants.sql` is mandatory for conformance.
- It must enforce:
  - unique `parent_students(parent_id, student_id)`
  - unique `student_teacher_selections(student_id, subject_id)`
- Environments missing these constraints are non-conformant and must not be considered deploy-ready.
- Backend startup and `/ready` checks both enforce these invariants; startup should fail fast if they are missing.

Verify workflow-critical DB invariants after applying migrations:

```bash
cd edu-backend
npm run db:verify-invariants
```

Regenerate canonical schema snapshot from the migrated database:

```bash
cd edu-backend
npm run schema:export
```

Or run one post-migration command that enforces verify-then-export:

```bash
cd edu-backend
npm run schema:refresh:after-migrate
```

This writes `edu-backend/schema/edu_platform_schema.snapshot.sql`.
This SQL snapshot is the repository's authoritative schema artifact because it is
generated directly from the migrated database state.

`edu_platform_schema.pdf` is a published review artifact only when regenerated
from the migrated DB state (or from this fresh SQL snapshot). A PDF produced
earlier is stale and non-conformant.

Single-command schema publication path for release:

```bash
cd edu-backend
npm run schema:publish:release
```

This enforces:
1. migration set validation,
2. critical invariant verification,
3. schema snapshot export from the actual migrated DB.

## Release order (schema trust)

Always release in this order:

1. Apply DB migrations on the target environment.
2. Run `npm run schema:publish:release` against that migrated DB.
3. Publish/version the regenerated schema artifacts (`.sql` and optional refreshed PDF).
4. Release application code.

If migrations changed but schema artifacts were not regenerated after migration,
the release is non-conformant.

### Academic scope convergence (students table)

- Operational academic scope source-of-truth is normalized fields only:
  - `students.system_id`
  - `students.stage_id`
  - `students.grade_level_id`
- Legacy `students.grade_stage` and `students.grade_number` are transitional compatibility leftovers.
- New operational logic (backend or frontend) must not read legacy fields as primary truth.
- Registration steady-state routes now reject legacy-only scope payloads (`gradeStage`/`gradeNumber`)
  and require canonical `systemId`/`stageId`/`gradeLevelId` (error code:
  `LEGACY_ACADEMIC_SCOPE_NOT_SUPPORTED`).
- Legacy fields can be dropped only after all consumers are confirmed clean, including:
  1. registration/onboarding clients submit normalized scope ids,
  2. API contracts no longer require legacy compatibility keys,
  3. dashboards/discovery/selection/booking flows remain normalized-only in tests.

## 3) Build + Quality Gates (Local Pre-Deploy)

Backend:

```bash
cd edu-backend
npm ci
npm run lint
npm test
npm run test:coverage
```

Frontend:

```bash
cd edu-frontend
npm ci
npm run lint
npm run build
```

## 4) Start Services

Backend:

```bash
cd edu-backend
npm start
```

Frontend:

```bash
cd edu-frontend
npm start
```

## 5) Health Checks

Backend endpoints:

- `GET /health` (liveness)
- `GET /ready` (readiness with DB + schema-invariant checks)

## 6) Rollback Procedure

1. Stop traffic to current app process.
2. Re-deploy previous known-good backend/frontend commit.
3. If migration introduced backward-incompatible change, restore DB backup (recommended before migration batch).
4. Re-run smoke checks (`/health`, `/ready`, login, dashboard load).

For detailed release/rollback checklist, see `docs/DEPLOYMENT_CHECKLIST.md`.
