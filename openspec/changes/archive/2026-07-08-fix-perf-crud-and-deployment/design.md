## Context

HMTI is a Vue 3 (Vite + Tailwind + Pinia) frontend and a NestJS + Prisma backend, deployed on a VPS (`163.61.58.127`) behind Nginx + PM2, with a purchased domain `hmti.my.id`. Five defects were reported and confirmed by code inspection:

1. **Mobile performance** — `AnimatedBackground.vue` renders, on every admin page, ~7 large `blur-3xl` orbs with continuous `animate-blob`, 22 rising particles, 12 box-shadow sparkles, 8 spinning geometric rings, 3 pulse rings, 3 shooting stars, a dot grid, and a noise layer — all animating nonstop, plus a `mousemove` parallax listener. On mobile GPUs the large blur filters dominate compositing and cause jank.
2. **Member edit fails** — `Anggota.vue.editMember()` does `newMember.value = { ...member }`, so the PATCH body includes server-managed/sensitive fields (`password`, `joinedAt`, `avatarUrl`, `avatarDriveFileId`). The controller uses `@Body() data: any` (so the global `ValidationPipe` with `whitelist/forbidNonWhitelisted` is bypassed — it only validates typed DTOs), and the raw object is passed to `prisma.member.update({ data })`, which rejects unknown/incompatible fields.
3. **Unclickable action buttons** — `SpeedDialNav` is `fixed bottom-6 left-6 z-50`; the member table's "Aksi" column is on the left with content at `z-10`. The FAB overlaps the left action column of lower rows and intercepts clicks, worsening as the viewport shortens. A `transform: scale-[1.015]` applied to hovered `<tr>` compounds hit-area issues.
4. **Domain unreachable on mobile** — likely missing/unpropagated `www` DNS record and/or an incomplete TLS chain (mobile browsers don't fetch missing intermediates).
5. **No HTTPS on VPS** — Nginx currently only has the `listen 80` example; no working Certbot certificate for the real domain.

Constraint: this is a production system in active use; changes must be low-risk and reversible. The VPS password was shared in chat and must be rotated.

## Goals / Non-Goals

**Goals:**
- Make admin pages smooth on mobile without losing the desktop look.
- Make member editing reliably work, backed by a validated update DTO.
- Guarantee member table action buttons are always clickable.
- Serve `hmti.my.id` and `www.hmti.my.id` over valid, auto-renewing HTTPS, reachable on mobile.

**Non-Goals:**
- No redesign of the animated background's desktop appearance.
- No database schema changes.
- No migration off SQLite or change of hosting provider.
- No full SSH hardening rewrite (documented separately); we only make the minimal server/DNS/TLS changes needed to fix reachability.

## Decisions

### D1: Gate animation cost behind a responsive + reduced-motion flag
Introduce a small reactive check (`matchMedia('(max-width: 767px)')` and `matchMedia('(prefers-reduced-motion: reduce)')` and `(pointer: coarse)`). On mobile/reduced-motion, render a trimmed element set (e.g. 2–3 orbs, no particle/sparkle/shooting-star loops, reduced blur) and skip the `mousemove` listener. Reactively update on resize.
- **Alternative considered**: CSS-only `@media` hiding of elements — rejected because the JS `mousemove` listener and the sheer element count still cost work; a JS gate also lets us skip creating listeners entirely.
- **Alternative considered**: Remove the background entirely on mobile — rejected as it degrades the brand feel more than necessary; a trimmed static gradient keeps identity.

### D2: Whitelist the member update payload on both ends
Frontend: build the PATCH body from an explicit field list (`npm, name, angkatan, jabatan, role, status` + optional contact fields), not `{ ...member }`. Backend: add `UpdateMemberDto` (class-validator, all fields optional) and type the controller `@Body() dto: UpdateMemberDto` so the existing global `ValidationPipe` enforces whitelist + `forbidNonWhitelisted`.
- **Why both**: The frontend fix alone resolves the reported bug; the DTO makes the endpoint robust against any future/other caller and turns bad input into a clean 400 instead of a Prisma crash. NIA is the immutable key (route param), so it is not in the editable set.

### D3: Fix stacking/overlap rather than move the FAB far away
Ensure the table content/sticky header and the action column establish a higher effective stacking context than needed, and constrain the `SpeedDialNav` so it does not sit over interactive content: reduce its footprint when collapsed and/or add bottom padding to the scroll area so the last rows clear the FAB. Remove the `transform: scale` on `<tr>` (or move the hover effect to a non-transform property / inner cell) to keep hit areas stable.
- **Alternative considered**: Only bump z-index of the action cell — rejected as brittle; combining layout clearance + removing the row transform is more reliable across breakpoints.

### D4: DNS + Nginx server_name for both apex and www, TLS via Certbot with full chain
Add/verify DNS `A` records for `hmti.my.id` and `www.hmti.my.id` → VPS IP. Configure Nginx `server_name hmti.my.id www.hmti.my.id;` and run `certbot --nginx -d hmti.my.id -d www.hmti.my.id` to obtain one cert covering both, with HTTP→HTTPS redirect and `fullchain.pem` (complete chain for mobile). Verify propagation and chain with external tooling before declaring done.
- **Why one cert with both SANs**: Simplest correct setup; guarantees `www` works and the chain is complete for mobile clients.

## Risks / Trade-offs

- **[Trimming background changes mobile visuals]** → Acceptable and intended; desktop unchanged, mobile still shows a branded gradient.
- **[DTO whitelist could reject a field the UI legitimately sends]** → Enumerate the editable set from the form fields; test add + edit before/after.
- **[Certbot/DNS changes are outward-facing and can cause downtime if misconfigured]** → Back up existing Nginx config, use `nginx -t` before reload, keep the old config to roll back; do DNS TTL-aware changes.
- **[Working directly on production VPS with shared root password]** → Rotate the password immediately after; prefer key-based access; snapshot/backup DB (`backup-hmti.sh`) before infra changes.
- **[Live edits vs. repo]** → Update `deploy/nginx-hmti.conf.example` to match the real config so the repo stays the source of truth.

## Migration Plan

1. Frontend + backend code changes on a branch; build locally.
2. Deploy backend (`npm run build` → `scp dist` → `pm2 restart hmti-backend`) and frontend (`npm run build` → `scp dist`) per `note penting.txt`.
3. Infra: back up Nginx config and DB; set DNS records; update Nginx server blocks; run Certbot; `nginx -t` then reload.
4. Verify: mobile smoke test, member edit, action-button clicks at multiple sizes, HTTPS on apex+www from desktop and mobile.
5. Rollback: restore previous Nginx config + reload; redeploy prior `dist` if a code regression appears.
6. Post-work: rotate VPS password / add SSH key.

## Open Questions

- Which DNS provider hosts `hmti.my.id`, and do we have panel access (needed to add/verify the `www` record)? If DNS is not manageable, mobile reachability cannot be fully fixed.
- Is the frontend served by Nginx as static files at the apex, with the API on a path/subdomain? Need the live Nginx layout to place TLS and redirects correctly.
- Current live app path is `/var/www/Project-web-HMTI` (per notes), not `/var/www/hmti` (per docs) — confirm the actual deployed path before touching configs.
