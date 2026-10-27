# HMTI Integrated Student Organisation System

An integrated administration system for HMTI (Himpunan Mahasiswa Teknik
Informatika), built as a single-page application. It covers member records,
dues and cash-flow tracking, activity documentation stored in Google Drive,
and a public landing page. Built as my undergraduate thesis project at
Universitas Bani Saleh.

## Features

**Members**
- Member CRUD restricted to the organisation's officers (`ketum`, `sekretaris`, `bendahara`)
- Bulk import from an Excel template, with a downloadable template
- Self-service profile: edit own data, change password, upload an avatar (stored in Google Drive)

**Finance**
- Dues configuration managed by the treasurer (`bendahara`)
- Monthly dues generation per period, triggered by an officer from the admin dashboard
- Late fees applied to overdue dues when the finance page loads
- Per-member arrears, organisation-wide dues summary, and an Excel dues report
- Cash transaction log with payment method and proof-of-payment upload, plus an Excel report

**Documentation and public page**
- Upload, preview, and download documents and media; files live in Google Drive, not on the app server
- Public landing page showing officers, activity gallery, events, and achievements from an active-content feed that officers can toggle per item
- Download endpoint for the companion Android app (`E-HMTI.apk`)

**Access control**
- Login with NIA (member ID) and password; passwords hashed with bcrypt; sessions use JWT
- Role guard on officer-only endpoints; regular members (`anggota`) see their own data and dues
- Google OAuth 2.0 sign-in endpoint on the backend (`/auth/google`); it returns the Google profile and is not yet linked to member accounts or the frontend

## Architecture

```
┌──────────────────────────────┐
│  Vue 3 SPA (Vite)            │  Vue Router, Pinia, axios, Tailwind CSS
└──────────────┬───────────────┘
               │ REST/JSON, Authorization: Bearer <JWT>
┌──────────────▼───────────────┐
│  NestJS API                  │  Passport (local, JWT, Google OAuth)
│                              │  Role guard, express-rate-limit (100 req/min per IP)
└───────┬──────────────┬───────┘
        │              │
┌───────▼──────┐ ┌─────▼────────────────────────────┐
│ Prisma ORM   │ │ Google Drive API (googleapis)    │
│ SQLite       │ │ upload: in-memory buffer → Drive │
└──────────────┘ │ download: streamed to the client │
                 │ retry with backoff on 429        │
                 └──────────────────────────────────┘
```

Implementation notes, all in `hmti-backend/src`:

- **Uploads** are received by multer in memory (10 MB limit for documents) and sent to Drive with `files.create`.
- **Previews and downloads** request the Drive file as a stream and pipe it straight to the HTTP response, so the server never holds the whole file in memory.
- **Rate limits from Drive (HTTP 429)** are retried with exponential backoff (1 s, then 2 s; 3 attempts by default). 403 and 404 fail immediately because retrying will not fix them.
- **Document listing** is paginated (default 20, maximum 100). `Document` has indexes on `type`, `uploadDate`, and `driveFileId`; `driveFileId` is unique.
- **Optional packages** (`express-rate-limit`, `node-cache`) are loaded with `require` inside `try/catch`. If they are missing, the server still starts with that feature disabled.
- **Graceful shutdown** on SIGTERM/SIGINT, plus periodic heap-usage logging with warning thresholds.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Vue 3, Vite 7, Vue Router, Pinia, Tailwind CSS 3, axios |
| Backend | NestJS 11 (TypeScript) |
| Database | SQLite via Prisma 5 |
| Auth | Passport (local, JWT, Google OAuth 2.0), bcrypt |
| File storage | Google Drive API (`googleapis`) |
| Reports | ExcelJS |
| Testing | Jest (backend) |

## Running locally

Prerequisites: Node.js `^20.19.0` or `>=22.12.0`, and a Google Cloud project with OAuth 2.0 credentials and the Drive API enabled.

### 1. Backend

```bash
cd hmti-backend
npm install
cp .env.example .env        # then fill in the values below
npx prisma migrate deploy   # creates hmti-backend/prisma/dev.db
npm run start:dev           # http://localhost:3000
```

The SQLite path is set directly in `prisma/schema.prisma` (`file:./dev.db`, relative to the schema), so the `DATABASE_URL` entry in `.env.example` has no effect.

Environment variables (see `hmti-backend/.env.example`):

| Variable | Required | Purpose |
| --- | --- | --- |
| `JWT_SECRET` | Yes | Signs and verifies JWTs; the server refuses to start without it |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth sign-in; the server refuses to start without them |
| `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN` | For uploads | Drive API access |
| `GOOGLE_DRIVE_PARENT_FOLDER_ID` | For uploads | Default Drive folder |
| `FOLDER_ID_SURAT`, `FOLDER_ID_MEDIA`, `FOLDER_ID_BRANDING`, `FOLDER_ID_AVATARS` | For uploads | Drive folder per document category |
| `EHMTI_APK_FILE_ID` | No | Drive file ID of the Android app for the download endpoint |
| `PORT`, `CORS_ORIGINS` | No | Production settings |

There is no seed script. To create the first officer account, open `npx prisma studio`, add a `Member` row with role `ketum`, and store a bcrypt hash as the password:

```bash
node -e "console.log(require('bcrypt').hashSync('your-password', 10))"
```

### 2. Frontend

```bash
cd hmti-frontend
npm install
npm run dev                 # http://localhost:5173
```

The API URL comes from `VITE_API_BASE_URL` in `hmti-frontend/.env.development` (default `http://localhost:3000`).

## Project structure

```
hmti-backend/     NestJS API
  prisma/         Prisma schema and migrations
  src/            auth, members, finance (dues), transactions, documents (Drive), showcase
  test/           e2e test
hmti-frontend/    Vue 3 SPA (views, components, Pinia stores, router)
deploy/           PM2 ecosystem file, nginx config example, backup script
docs/             Deployment guides, implementation notes, black-box test results
openspec/         Specs and archived change proposals
```

## Testing

- **Black-box testing:** test scenarios and results are in [docs/blackbox-testing-hmti.html](docs/blackbox-testing-hmti.html).
- **Automated tests:** a small Jest suite in `hmti-backend` (`npm test`, `npm run test:e2e`). Currently 6 of 11 unit tests pass, along with the e2e test. The 5 failing tests are generated `should be defined` specs that lack provider mocks.

## Spec-first development

Later features and fixes were planned with [OpenSpec](https://github.com/Fission-AI/OpenSpec) before implementation. `openspec/specs/` holds the current capability specs. `openspec/changes/archive/` holds each completed change (proposal, design, tasks, and spec deltas), dated by when it was archived, for example `2026-07-10-fix-members-credential-leak`.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), [docs/PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md), and [docs/TUTORIAL-DEPLOY-DETAIL.md](docs/TUTORIAL-DEPLOY-DETAIL.md).

## Author

**Muhammad Hariyanto Gionova**, Informatics Engineering, Universitas Bani Saleh
