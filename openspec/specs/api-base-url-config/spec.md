# Spec: API Base URL Config

## Purpose

Defines requirements for how the frontend resolves the backend API base URL, the shared HTTP client all API calls go through, diagnosable CORS rejection behavior, and the documented reverse-proxy path in production.

## Requirements

### Requirement: Frontend resolves API base URL from build-time configuration
The frontend SHALL resolve the backend API base URL exclusively from the `VITE_API_BASE_URL` build-time environment variable, defaulting to the same-origin path `/api` when the variable is not set. No frontend source file SHALL contain a hardcoded backend host or port.

#### Scenario: Production build without explicit configuration
- **WHEN** the frontend is built without `VITE_API_BASE_URL` set and a page requests member data
- **THEN** the request is sent to the same-origin path `/api/members` (no cross-origin request, no CORS preflight)

#### Scenario: Development build with local backend
- **WHEN** the developer runs `npm run dev` with the committed `.env.development` present
- **THEN** API requests are sent to `http://localhost:3000/...` and the local workflow behaves as before

#### Scenario: No hardcoded backend hosts remain
- **WHEN** the frontend source tree (`src/`) is searched for `localhost:3000`
- **THEN** zero matches are found

### Requirement: All API calls go through a single shared HTTP client
The frontend SHALL provide a single axios instance module (`src/api/http.js`) configured with the resolved base URL, and all components, stores, and API modules SHALL perform backend requests through it using relative paths.

#### Scenario: Component performs an API request
- **WHEN** any view, store, or component needs backend data (e.g., members, finance, showcase, documents, auth)
- **THEN** it imports the shared instance and calls a relative path (e.g., `http.get('/members')`) rather than constructing an absolute URL

### Requirement: CORS rejection is diagnosable, not a server error
The backend SHALL respond to requests from disallowed origins without throwing, so the response carries a normal status (blocked client-side by the missing `Access-Control-Allow-Origin` header) instead of a 500 Internal Server Error, and SHALL log the rejected origin.

#### Scenario: Request from a disallowed origin
- **WHEN** a browser request arrives with an `Origin` header not in the `CORS_ORIGINS` allowlist
- **THEN** the server responds without CORS headers and without a 500, and logs a warning naming the rejected origin

### Requirement: Production reverse-proxy path is documented
The deployment documentation SHALL include the Nginx configuration that proxies `/api/` to the backend on `127.0.0.1:3000` (stripping the `/api` prefix) and the verification steps (curl smoke test) required before restricting public access to port 3000.

#### Scenario: Operator follows the runbook on a fresh VPS
- **WHEN** the operator applies the documented Nginx block and reloads Nginx
- **THEN** `curl http://<host>/api/members` returns the members JSON served by the backend
