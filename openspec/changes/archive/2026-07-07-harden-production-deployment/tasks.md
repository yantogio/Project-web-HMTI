## 1. Repository Data Hygiene

- [x] 1.1 Confirm `hmti-backend/prisma/dev.db` is removed from Git tracking without deleting the local file.
- [x] 1.2 Add ignore rules for `hmti-backend/prisma/dev.db` and related local SQLite journal files.
- [x] 1.3 Verify `git status --short` shows the database as removed from tracking and not as a new untracked file.

## 2. Backend Runtime Hardening

- [x] 2.1 Add `helmet` to `hmti-backend` runtime dependencies and update the lockfile.
- [x] 2.2 Patch `hmti-backend/src/main.ts` to import `ValidationPipe` and `helmet`.
- [x] 2.3 Replace permissive `app.enableCors()` with strict `CORS_ORIGINS` allowlist handling.
- [x] 2.4 Enable Express trust proxy before proxy-aware middleware runs.
- [x] 2.5 Register a global `ValidationPipe` with whitelist, forbid non-whitelisted fields, and transform enabled.
- [x] 2.6 Register Helmet middleware and tune only narrowly if existing auth, uploads, or static serving require it.
- [x] 2.7 Keep existing rate limiting, health-check skip behavior, memory monitoring, and graceful shutdown behavior working.

## 3. VPS Deployment Documentation

- [x] 3.1 Add production environment variable documentation including `PORT`, `CORS_ORIGINS`, database configuration, JWT secrets, Google OAuth values, upload/storage paths, and frontend URLs.
- [x] 3.2 Add VPS baseline steps for non-root deploy user, SSH key login, SSH hardening, UFW, fail2ban, and 2 GB swap.
- [x] 3.3 Add Nginx reverse proxy configuration for the backend port with forwarded headers.
- [x] 3.4 Add Certbot steps for HTTPS certificate issuance, renewal checks, and HTTP-to-HTTPS redirect.
- [x] 3.5 Add PM2 setup steps for build/start, named process, startup persistence, logs, restart, and deploy update flow.
- [x] 3.6 Add cron backup steps that create timestamped backups, write logs, restrict permissions, and describe restore verification.

## 4. Verification

- [x] 4.1 Run backend install/build checks after dependency and bootstrap changes.
- [x] 4.2 Verify allowed and rejected CORS origin behavior.
- [x] 4.3 Verify unknown payload fields are rejected by global validation on a DTO-backed endpoint.
- [x] 4.4 Verify Helmet headers are present on backend responses.
- [x] 4.5 Verify deployment documentation commands are internally consistent for the selected VPS layout.
- [x] 4.6 Run `openspec status --change "harden-production-deployment"` and confirm the change is apply-ready.
