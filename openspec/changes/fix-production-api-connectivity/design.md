## Context

The Vue 3 frontend calls the NestJS backend via absolute URLs hardcoded as `http://localhost:3000` in 10 files (~34 call sites): `api/documentApi.js`, `stores/auth.js`, `components/AdminPageLayout.vue`, `views/Anggota.vue`, `views/DocsView.vue`, `views/FinanceView.vue`, `views/HomeView.vue`, `views/LoginView.vue`, `views/Profile.vue`, `views/ShowcaseHub.vue`. Only `DocsView.vue` reads `VITE_API_BASE_URL`. In production (VPS at `163.61.58.127`, Nginx serving the built frontend on port 80, NestJS on port 3000 behind PM2) the browser therefore makes cross-origin requests to `:3000`, which fail because `CORS_ORIGINS` is unset (empty allowlist in production per `main.ts`) and the rejection is thrown as an `Error`, surfacing as an opaque 500. The SQLite database on the VPS is intact; no data-layer problem exists.

## Goals / Non-Goals

**Goals:**
- All frontend API traffic goes through one configurable axios instance; production default is same-origin `/api` so CORS is bypassed entirely.
- Local development (`vite` on 5173 + Nest on 3000) keeps working with zero extra setup.
- CORS misconfiguration produces a diagnosable 403, never a 500.
- A documented Nginx + `.env` runbook makes the VPS serve `/api/*` to the backend and allows closing port 3000 publicly.

**Non-Goals:**
- No HTTPS/domain setup (separate effort; requires a domain for Certbot and Google OAuth).
- No change to backend routes, controllers, Prisma schema, or data.
- No refactor of component logic beyond swapping the HTTP client/URLs.

## Decisions

**1. Same-origin `/api` proxy over CORS allowlisting.**
Serving frontend and API from one origin via Nginx `location /api/ { proxy_pass http://127.0.0.1:3000/; }` (trailing slash strips the `/api` prefix, so backend routes stay unchanged) eliminates the CORS failure class, lets UFW block public :3000, and survives IP/domain changes with zero rebuilds. Alternative — setting `CORS_ORIGINS=http://163.61.58.127` — works as an immediate hotfix but keeps the backend port exposed and couples every build to the server address; kept only as the documented interim measure.

**2. One shared axios instance, not per-file env reads.**
New `src/api/http.js` exports `axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api' })`. Components import it and use relative paths (`http.get('/members')`). A single choke point also gives a future home for an auth-header interceptor (today each call site attaches its token manually — left as-is). Alternative of interpolating `import.meta.env` in 34 places repeats the current fragility.

**3. Commit `.env.development` with `VITE_API_BASE_URL=http://localhost:3000`.**
Vite auto-loads it in dev mode, so `npm run dev` hits the local backend directly (no dev proxy needed) while production builds fall back to `/api`. Alternative — a Vite `server.proxy` — also works but changes dev behavior developers are used to.

**4. CORS rejection → allow-with-no-headers instead of thrown Error.**
In `main.ts`, return `callback(null, false)` for disallowed origins (browser blocks via missing header, server responds normally) rather than `callback(new Error(...))` which Express turns into a 500 and masks the real cause. Log the rejected origin at warn level for diagnosability.

## Risks / Trade-offs

- [One missed hardcoded URL silently breaks a feature] → Verify with `grep -r "localhost:3000" src/` returning zero matches (excluding `.env.development`) as an explicit task.
- [Nginx `proxy_pass` trailing-slash subtlety mangles paths] → Runbook includes a curl smoke test (`curl http://IP/api/members`) before switching DNS/announcing.
- [Dev flow changes surprise contributors] → `.env.development` is committed, so cloning + `npm run dev` behaves exactly as before.
- [Closing port 3000 too early during rollout] → Migration order: deploy Nginx block → deploy new frontend build → verify → then firewall the port.

## Migration Plan

1. (Interim hotfix, optional) Set `CORS_ORIGINS=http://163.61.58.127` on the VPS and restart PM2 to restore service immediately.
2. Merge code changes; build frontend locally/CI (`vite build`) — not on the 1 GB VPS.
3. Add Nginx `/api/` proxy block, `nginx -t && systemctl reload nginx`.
4. Upload new `dist/`; smoke-test `/api/members` and the home page.
5. Remove the interim `CORS_ORIGINS` entry (or keep for transition) and block public :3000 via UFW.
6. Rollback: restore previous `dist/` and remove the Nginx block; the interim `CORS_ORIGINS` hotfix re-enables the old direct-port path.

## Open Questions

- None blocking. Future: introduce a shared auth interceptor in `http.js`; HTTPS + domain once acquired.
