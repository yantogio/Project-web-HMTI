## Why

The backend is being prepared for VPS deployment and currently has production security gaps: a tracked local SQLite database, permissive CORS, missing global request validation, missing HTTP security headers, and no documented server hardening path. This change reduces deployment risk before the application is exposed publicly.

## What Changes

- Remove the local Prisma development database from Git tracking and ensure it is ignored going forward.
- Harden NestJS bootstrap behavior with strict CORS, Express trust proxy support, global `ValidationPipe`, and Helmet security headers.
- Add production deployment guidance for the agreed VPS shape: non-root deploy user, SSH-key access, UFW, fail2ban, and 2 GB swap.
- Add reverse proxy and process management guidance using Nginx, Certbot, and PM2.
- Add cron-based backup guidance for application data and database assets.
- Document required environment variables and operational checks so deployment is repeatable.

## Capabilities

### New Capabilities
- `backend-security-hardening`: Covers runtime security controls in the NestJS backend and repository handling for local development database files.
- `vps-production-operations`: Covers VPS baseline hardening, reverse proxy/TLS setup, PM2 process management, and scheduled backups.

### Modified Capabilities

## Impact

- Affected backend code: `hmti-backend/src/main.ts`, `hmti-backend/package.json`, and lockfile if a new dependency is installed.
- Affected repository hygiene: `hmti-backend/prisma/dev.db` removed from Git tracking and ignored.
- Affected deployment systems: VPS user/SSH/firewall/fail2ban/swap, Nginx, Certbot, PM2, cron backups, and environment configuration.
- No intentional API contract breakage; stricter validation may reject previously accepted unknown or malformed request payload fields.
