# HMTI Integrated Student Organisation System

A single-page application for managing a university student organisation:
member records, dues & cash-flow tracking, activity documentation, and a
public showcase page — replacing a workflow that previously ran on
scattered spreadsheets and personal Google Drive folders.

Built end to end as my final-year project at Universitas Bani Saleh and
evaluated by its intended users through formal User Acceptance Testing,
scoring **84.47% acceptance** on a Likert scale.

## Features

**Membership**
- Full member CRUD with role-based access (admin vs. member)
- Bulk import via Excel template, with a downloadable template generator
- Self-service profile: update own data, change password, upload avatar

**Finance**
- Configurable dues rules, with automatic monthly dues generation
- Automatic late-fee application for overdue dues
- Per-member arrears lookup and organisation-wide dues summary/report
- General cash transaction log with report export

**Documentation & showcase**
- Upload, preview, and download activity documents/media, streamed
  directly from Google Drive (not stored on the app server)
- Public showcase page pulling from an active-content feed, toggleable
  per item by an admin
- Companion Android app (E-HMTI.apk) distributed via a dedicated download
  endpoint

**Auth & access**
- Local email/password login (bcrypt + JWT) alongside Google OAuth login
- Route-level role guard restricting admin-only endpoints

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Vue.js 3, Vite, Pinia, Tailwind CSS |
| Backend | NestJS (TypeScript) |
| ORM & database | Prisma, SQLite |
| Auth | Passport (JWT, Local, Google OAuth 2.0) |
| File storage | Google Drive API |

## Engineering decisions

### Files are streamed, not buffered

Documents and videos live in Google Drive rather than on the application
server. The API pipes them through in 64KB chunks instead of loading each
file into memory first, so a 100MB video costs roughly one chunk of memory
per request instead of 100MB.

### Surviving Google Drive rate limits

The Drive API returns 429 when it is hit too hard. Those are retried with
exponential backoff (1s, 2s, 4s) up to five attempts. 404 and 403 are not
retried — a missing file or a permission problem will not fix itself, so
failing immediately is both faster and more honest to the caller.

### Pagination and indexes

The documents endpoint is paginated (default 20, maximum 100) so response
size stays bounded as the archive grows. Prisma indexes on `uploadDate`,
`driveFileId`, and `type` cover the sort and lookup paths the application
actually uses, and `driveFileId` is unique so two records can never point
at the same Drive file.

### Operational safety

Rate limiting at 100 requests per minute per IP, periodic heap logging with
warning thresholds, graceful SIGTERM/SIGINT shutdown, and stream cleanup
when a client disconnects mid-download.

### Graceful degradation

Optional packages for caching and rate limiting are loaded lazily. If they
are not installed the server still starts with those features disabled
rather than crashing on boot.

## Project structure

    hmti-backend/    NestJS API, Prisma schema and migrations
    hmti-frontend/   Vue 3 single-page application
    deploy/          Deployment configuration
    docs/            Deployment guide, implementation notes, test results

## Getting started

### Prerequisites

- Node.js `^20.19.0` or `>=22.12.0`
- A Google Cloud project with Drive API + OAuth 2.0 credentials

### 1. Backend

```bash
cd hmti-backend
npm install
cp .env.example .env   # fill in the values below
npx prisma migrate deploy
npm run start:dev
```

Required environment variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Prisma DB connection, e.g. `file:./prisma/dev.db` |
| `JWT_SECRET` | Required — server refuses to start without it |
| `GOOGLE_DRIVE_CLIENT_ID` / `_CLIENT_SECRET` / `_REFRESH_TOKEN` | Google Drive API access |
| `GOOGLE_DRIVE_PARENT_FOLDER_ID` | Root Drive folder for uploads |
| `FOLDER_ID_SURAT` / `_MEDIA` / `_BRANDING` / `_AVATARS` | Sub-folders per document category |
| `EHMTI_APK_FILE_ID` | Drive file ID for the companion Android app (optional; download endpoint stays disabled without it) |
| `PORT`, `CORS_ORIGINS` | Optional, production only |

### 2. Frontend

```bash
cd hmti-frontend
npm install
npm run dev
```

## Documentation

- [Deployment guide](docs/DEPLOYMENT.md)
- [Implementation notes](docs/IMPLEMENTATION_SUMMARY.md)
- [Black-box test results](docs/blackbox-testing-hmti.html)

## Author

**Muhammad Hariyanto Gionova** — Informatics Engineering, Universitas Bani Saleh
