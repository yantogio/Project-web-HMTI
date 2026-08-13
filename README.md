# HMTI Integrated Student Organisation System

A single-page application for managing a university student organisation:
member records, activity documentation, and an organisational document
archive — replacing a workflow that previously ran on scattered
spreadsheets and personal Google Drive folders.

Built end to end as my final-year project at Universitas Bani Saleh and
evaluated by its intended users through formal User Acceptance Testing,
scoring **84.47% acceptance** on a Likert scale.

## Features

_[BAGIAN INI YANG PERLU KAMU ISI]_

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Vue.js 3, Vite |
| Backend | NestJS (TypeScript) |
| ORM & database | Prisma, SQLite |
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

## Running locally

_[isi dari INSTALLATION_GUIDE.md — ringkas jadi 4–6 langkah]_

## Project structure

    hmti-backend/    NestJS API, Prisma schema and migrations
    hmti-frontend/   Vue 3 single-page application
    deploy/          Deployment configuration
    docs/            Deployment guide, implementation notes, test results

## Documentation

- [Deployment guide](docs/DEPLOYMENT.md)
- [Implementation notes](docs/IMPLEMENTATION_SUMMARY.md)
- [Black-box test results](docs/blackbox-testing-hmti.html)
