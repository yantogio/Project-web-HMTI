## Why

The system is deployed on a VPS (1 vCPU / 1 GB RAM) but the frontend cannot load any data. Browser requests from `http://163.61.58.127` to the backend at `http://163.61.58.127:3000` are rejected: `CORS_ORIGINS` is unset in production so the allowlist is empty, and the CORS rejection is thrown as an `Error`, which Express surfaces as a misleading **500 Internal Server Error** with no `Access-Control-Allow-Origin` header. The root structural cause is that the frontend hardcodes `http://localhost:3000` in ~34 call sites across 10 files, forcing the browser to call the backend cross-origin on an exposed port instead of same-origin through Nginx.

## What Changes

- Add a single shared axios instance (`src/api/http.js`) with `baseURL` from `VITE_API_BASE_URL`, defaulting to `/api` — all frontend API calls go through it.
- Replace all hardcoded `http://localhost:3000` URLs (10 files, ~34 call sites) with the shared instance / relative paths.
- Add `.env.development` (`VITE_API_BASE_URL=http://localhost:3000`) so local dev keeps working unchanged.
- Backend: return CORS rejections as a clean 403 instead of a 500, so misconfiguration is diagnosable; keep the `CORS_ORIGINS` allowlist for any remaining cross-origin use.
- Document the Nginx `location /api/` reverse-proxy block and the production `.env` settings (deployment runbook) so requests become same-origin and port 3000 can be closed from public access.

## Capabilities

### New Capabilities
- `api-base-url-config`: Frontend resolves the backend API base URL from build-time configuration with a same-origin `/api` production default; no component may hardcode a backend host.

### Modified Capabilities

<!-- none — existing specs cover features (finance, members, docs, avatars); their requirements are unchanged, only how the frontend addresses the backend changes -->

## Impact

- **Frontend**: `src/api/documentApi.js`, `src/stores/auth.js`, `src/components/AdminPageLayout.vue`, `src/views/Anggota.vue`, `src/views/FinanceView.vue`, `src/views/DocsView.vue`, and the other files containing `localhost:3000`; new `src/api/http.js`; new `.env.development`.
- **Backend**: `src/main.ts` CORS error handling only (allowlist logic unchanged).
- **Infrastructure**: Nginx config on the VPS gains an `/api/` proxy block; UFW can then block public access to port 3000. No database or schema changes — the data layer is healthy.
- **Breaking**: none for users; developers must run the frontend with the new `.env.development` (committed) for local API calls.
