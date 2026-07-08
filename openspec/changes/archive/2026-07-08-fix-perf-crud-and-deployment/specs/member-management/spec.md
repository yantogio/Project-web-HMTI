## ADDED Requirements

### Requirement: Editing an existing member updates only whitelisted fields

Updating a member SHALL succeed and SHALL only accept editable fields (`npm`, `name`, `angkatan`, `jabatan`, `role`, `status`, and optionally `email`, `phone`, `bio`). The client SHALL NOT send server-managed or sensitive fields (`password`, `joinedAt`, `avatarUrl`, `avatarDriveFileId`, relations) in the update payload. The backend update endpoint SHALL validate and whitelist the request body via a dedicated DTO instead of accepting an untyped `any` body, rejecting unknown fields rather than passing them to the database layer.

#### Scenario: Admin edits a member successfully
- **WHEN** an authorized admin opens the edit modal for an existing member, changes fields, and saves
- **THEN** the request contains only editable fields and the member record is updated without a server error, and the updated data is shown in the table

#### Scenario: Server-managed fields are not accepted
- **WHEN** an update request includes a non-editable field such as `password` or `joinedAt`
- **THEN** the backend rejects or strips the disallowed field and does not corrupt the stored record

#### Scenario: Update endpoint uses a validated DTO
- **WHEN** the `PATCH /members/:id` endpoint receives a body
- **THEN** the body is validated against an `UpdateMemberDto` with whitelisting enabled, and invalid payloads return a 400 rather than a database error
