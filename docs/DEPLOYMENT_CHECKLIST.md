# Deployment Checklist (No Docker)

## Pre-Deploy

- [ ] Confirm branch/commit and changelog summary.
- [ ] Confirm backend/frontend env values are set correctly in target environment.
- [ ] Run CI checks (lint, tests, coverage, build, audit, secret scan).
- [ ] Create database backup/snapshot.
- [ ] Validate migration files: `npm run migrations:validate` in `edu-backend`.

## Deploy

- [ ] Apply migrations in order from `edu-backend/scripts/migrations`.
- [ ] Deploy backend process.
- [ ] Deploy frontend build.
- [ ] Verify backend health endpoints (`/health`, `/ready`).

## Smoke Tests

- [ ] Login (student/parent/admin).
- [ ] Dashboard load for each role.
- [ ] Key mutation path (e.g., request/approve/cancel flow).
- [ ] Notifications and announcements load.

## Rollback

- [ ] Re-point to previous app build/commit.
- [ ] Restore database backup if migration is not backward compatible.
- [ ] Re-run smoke tests.
