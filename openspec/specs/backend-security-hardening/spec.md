# Spec: Backend Security Hardening

## Purpose

Defines baseline security requirements for the backend runtime: repository hygiene for local databases, strict CORS, reverse-proxy trust, global payload validation, and HTTP security headers.
## Requirements
### Requirement: Local development database is not tracked
The repository MUST NOT track local Prisma SQLite development database files, and ignore rules SHALL prevent accidental recommit of those files.

#### Scenario: dev database remains local
- **WHEN** `hmti-backend/prisma/dev.db` exists in the working tree
- **THEN** Git does not include it as a tracked or newly staged file

### Requirement: Backend CORS uses an explicit allowlist
The backend SHALL restrict browser CORS access to origins configured by environment variables.

#### Scenario: allowed browser origin
- **WHEN** a browser request includes an `Origin` value listed in the configured allowlist
- **THEN** the backend responds with CORS headers that allow that origin

#### Scenario: rejected browser origin
- **WHEN** a browser request includes an `Origin` value not listed in the configured allowlist
- **THEN** the backend rejects the request through the CORS policy

#### Scenario: no origin operational request
- **WHEN** a server-to-server request or health check has no `Origin` header
- **THEN** the backend does not reject it solely because the header is absent

### Requirement: Backend trusts the reverse proxy
The backend SHALL enable Express trust proxy behavior so proxy-aware features use the Nginx-forwarded client metadata in production.

#### Scenario: proxied request metadata
- **WHEN** the backend receives a request through Nginx with forwarded headers
- **THEN** proxy-aware middleware can resolve the original client protocol and IP information

### Requirement: Backend validates request payloads globally
The backend SHALL apply a global validation pipe that strips or rejects unexpected payload fields and transforms DTO-compatible values.

#### Scenario: unknown payload field
- **WHEN** a request payload contains a field not allowed by the endpoint DTO
- **THEN** the backend rejects the request with a validation error

#### Scenario: DTO value transformation
- **WHEN** a request provides DTO-compatible primitive values that require transformation
- **THEN** the backend applies validation and transformation consistently without per-controller pipe setup

### Requirement: Backend sends HTTP security headers
The backend SHALL use Helmet or equivalent maintained middleware to emit HTTP security headers by default.

#### Scenario: security headers present
- **WHEN** a client receives a backend HTTP response
- **THEN** the response includes the configured Helmet security headers

### Requirement: Entitas Member selalu diserialisasi lewat select eksplisit

Setiap query Prisma yang hasilnya dikembalikan ke klien SHALL memakai klausa `select` eksplisit. Query `findMany()` atau `findUnique()` tanpa `select` MUST TIDAK dipakai pada model `Member`, karena setiap kolom baru pada skema akan otomatis ikut terkirim ke klien.

Ini melindungi dari kelas galat, bukan satu galat: `password` bocor persis karena `findAll()` memanggil `prisma.member.findMany()` polos.

#### Scenario: Kolom sensitif tidak pernah lolos

- **WHEN** kode mengembalikan satu atau banyak entitas `Member` ke klien
- **THEN** query yang menghasilkannya memakai `select` yang menyebutkan setiap kolom secara eksplisit
- **AND** `password` tidak termasuk di dalamnya

#### Scenario: Kolom baru aman secara bawaan

- **WHEN** kolom sensitif baru ditambahkan ke model `Member` di `schema.prisma`
- **THEN** kolom itu tidak muncul di respons API mana pun tanpa seseorang menambahkannya secara sadar ke `select`

### Requirement: Rute yang menulis data dijaga guard

Setiap rute yang membuat, mengubah, atau menghapus entitas SHALL memakai `@UseGuards(JwtAuthGuard, ...)`. Rute tulis tanpa guard MUST diperlakukan sebagai cacat keamanan.

#### Scenario: Rute tulis tanpa guard ditolak saat tinjauan

- **WHEN** sebuah handler `@Post`, `@Patch`, `@Put`, atau `@Delete` tidak memiliki dekorator guard
- **THEN** itu dianggap cacat yang harus diperbaiki sebelum rilis

#### Scenario: Permintaan tulis anonim ditolak

- **WHEN** klien tanpa autentikasi memanggil rute tulis mana pun
- **THEN** sistem membalas `401` sebelum handler dijalankan
- **AND** sistem TIDAK membalas `500`, karena `500` menandakan permintaan sudah mencapai handler

