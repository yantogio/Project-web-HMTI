## 1. Shared HTTP client

- [x] 1.1 Create `hmti-frontend/src/api/http.js` exporting `axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api' })`
- [x] 1.2 Create committed `hmti-frontend/.env.development` with `VITE_API_BASE_URL=http://localhost:3000`

## 2. Replace hardcoded URLs (import shared client, use relative paths)

- [x] 2.1 Migrate `src/api/documentApi.js` (rebase its axios instance on the shared config)
- [x] 2.2 Migrate `src/stores/auth.js` and `src/views/LoginView.vue`
- [x] 2.3 Migrate `src/views/Anggota.vue` (7 call sites incl. import/template download)
- [x] 2.4 Migrate `src/views/FinanceView.vue` (11 call sites) and `src/components/AdminPageLayout.vue` (2)
- [x] 2.5 Migrate `src/views/HomeView.vue` (4), `src/views/Profile.vue` (5), `src/views/ShowcaseHub.vue` (1)
- [x] 2.6 Migrate `src/views/DocsView.vue` (drop its own `VITE_API_BASE_URL` fallback in favor of the shared client)
- [x] 2.7 Verify `grep -r "localhost:3000" hmti-frontend/src/` returns zero matches

## 3. Backend CORS diagnosability

- [x] 3.1 In `hmti-backend/src/main.ts`, change the CORS origin callback to `callback(null, false)` for disallowed origins and log a warning with the rejected origin (no thrown Error / no 500)

## 4. Verification (local)

- [x] 4.1 Run frontend dev + backend locally; confirm login, members list, finance, docs, and home showcase load correctly
- [x] 4.2 Run `vite build` and confirm the built bundle contains no `localhost:3000` references

## 5. Deployment runbook & VPS rollout

- [x] 5.1 Add a deployment section (INSTALLATION_GUIDE.md or new DEPLOYMENT.md) documenting: Nginx `location /api/ { proxy_pass http://127.0.0.1:3000/; }` block, production `.env` (`NODE_ENV=production`, optional `CORS_ORIGINS`), and the curl smoke test
- [x] 5.2 On the VPS: add the Nginx block, `nginx -t`, reload; verify `curl http://163.61.58.127/api/members` returns data
- [x] 5.3 Upload the new frontend `dist/`; verify the site loads data end-to-end in a browser
- [x] 5.4 Block public access to port 3000 via UFW and re-verify the site still works
