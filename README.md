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
- `GET /ready` (readiness with DB check)

## 6) Rollback Procedure

1. Stop traffic to current app process.
2. Re-deploy previous known-good backend/frontend commit.
3. If migration introduced backward-incompatible change, restore DB backup (recommended before migration batch).
4. Re-run smoke checks (`/health`, `/ready`, login, dashboard load).

For detailed release/rollback checklist, see `docs/DEPLOYMENT_CHECKLIST.md`.
