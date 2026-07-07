## Context

The backend is a NestJS application deployed behind an expected Nginx reverse proxy on a VPS. `hmti-backend/src/main.ts` currently enables open CORS, has no global validation pipe, and does not enable Helmet or Express trust proxy. The repository also contained a tracked local Prisma SQLite development database, which risks committing real data.

Production deployment needs both application hardening and server hardening. The application should reject unexpected request fields, only accept browser traffic from configured origins, emit safer HTTP headers, and correctly interpret client/proxy information behind Nginx. The VPS should be prepared with a non-root deploy user, SSH-key access, firewalling, fail2ban, swap, TLS, PM2 process management, and scheduled backups.

## Goals / Non-Goals

**Goals:**
- Keep local development database files out of Git while preserving the developer's local file.
- Add strict, environment-driven CORS in `main.ts`.
- Enable Express trust proxy for deployment behind Nginx.
- Enable a global NestJS `ValidationPipe` with whitelist and transform behavior.
- Enable Helmet HTTP security headers.
- Provide repeatable VPS setup steps for non-root deployment, SSH keys, UFW, fail2ban, 2 GB swap, Nginx, Certbot, PM2, and cron backups.
- Include verification and rollback guidance for deployment.

**Non-Goals:**
- Changing authentication or authorization behavior.
- Replacing the database engine or redesigning Prisma models.
- Introducing container orchestration.
- Fully automating VPS provisioning with Ansible/Terraform.

## Decisions

1. Use environment-driven CORS allowlist.

   `CORS_ORIGINS` will contain comma-separated allowed origins. Production must set explicit frontend/admin origins. Local development can include localhost origins. This keeps deployments configurable without code edits.

   Alternative considered: hard-code deployment domains in `main.ts`. That is simpler, but brittle when staging or domain names change.

2. Fail closed on unknown browser origins in production.

   The CORS callback will allow requests without an `Origin` header for server-to-server and health checks, but reject browser origins not in the allowlist. This protects browser-facing API access while keeping operational checks usable.

   Alternative considered: allow all origins and rely on authentication. That leaves unnecessary attack surface and does not meet the deployment hardening goal.

3. Enable global request validation in bootstrap.

   Use `ValidationPipe` globally with `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true`. DTO-decorated endpoints reject unexpected fields consistently instead of relying on per-controller pipes.

   Alternative considered: keep per-controller validation. Existing usage is partial and easy to miss on new endpoints.

4. Add Helmet as a runtime dependency.

   Helmet provides a maintained default set of HTTP security headers. If any header conflicts with static file or OAuth behavior during implementation, tune Helmet options narrowly instead of disabling the middleware wholesale.

   Alternative considered: manually setting headers. That is more error-prone and easier to drift over time.

5. Document VPS operations in repo-managed deployment docs.

   Server hardening commands, Nginx/Certbot setup, PM2 lifecycle, and backup cron jobs should live in versioned documentation so deployment can be repeated and reviewed.

   Alternative considered: keep commands only in chat/history. That is not durable enough for production operations.

## Risks / Trade-offs

- Stricter validation may reject clients that currently send extra fields -> audit frontend requests and run API smoke tests before deploy.
- Misconfigured `CORS_ORIGINS` can block the frontend -> include explicit environment examples and a curl/browser verification step.
- Helmet defaults may affect cross-origin asset loading or OAuth flows -> test login, uploads, and static files after enabling.
- Trust proxy changes IP handling -> set it only for the expected Nginx proxy path and verify rate limiting still sees the correct client IP.
- Backup cron can silently fail if paths or permissions are wrong -> write logs, test restore manually, and keep backup destination permissions restricted.

## Migration Plan

1. Remove `hmti-backend/prisma/dev.db` from Git tracking and add ignore rules for local SQLite files.
2. Patch `hmti-backend/src/main.ts` and add `helmet` to backend dependencies.
3. Add deployment documentation covering VPS hardening, Nginx, Certbot, PM2, and cron backup.
4. Run backend build/tests locally.
5. Deploy to VPS as non-root user, install dependencies, apply environment variables, run migrations as needed, and start with PM2.
6. Configure Nginx reverse proxy and Certbot TLS.
7. Enable and test backup cron.
8. Verify health/API routes, CORS behavior, HTTPS redirect, PM2 restart, firewall status, fail2ban status, and backup output.

Rollback is limited to reverting the application commit, restoring the previous PM2 process build, and disabling any problematic Nginx site configuration. Do not re-track local database files.

## Open Questions

- Final production domain names and frontend origins need to be inserted into `CORS_ORIGINS` and Nginx server blocks during deployment.
- Backup destination needs confirmation: local compressed archive only, or off-server copy as well.
