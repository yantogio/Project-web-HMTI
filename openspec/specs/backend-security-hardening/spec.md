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
