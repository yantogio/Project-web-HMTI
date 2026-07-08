## 1. Mobile performance — AnimatedBackground

- [x] 1.1 Add reactive media checks in `AnimatedBackground.vue` for `(max-width: 767px)`, `(prefers-reduced-motion: reduce)`, and `(pointer: coarse)`, updating on change
- [x] 1.2 Only attach the `mousemove` parallax listener when not mobile/coarse-pointer and not reduced-motion; skip `orbStyle` translate work otherwise
- [x] 1.3 On mobile/reduced-motion, render a trimmed set (fewer orbs, drop particles/sparkles/shooting-stars loops, reduce blur radius) via `v-if`/computed arrays
- [x] 1.4 When `prefers-reduced-motion: reduce`, render a static gradient with no looping animations
- [ ] 1.5 Verify desktop light/dark appearance is unchanged and mobile scrolling is smooth (DevTools mobile emulation + real device)

## 2. Member edit bug — frontend payload

- [x] 2.1 In `Anggota.vue`, change `editMember` / `saveMember` to build the PATCH body from an explicit editable field list (`npm, name, angkatan, jabatan, role, status`, optional `email/phone/bio`) instead of `{ ...member }`
- [x] 2.2 Confirm `newMember` form model never carries `password`, `joinedAt`, `avatarUrl`, `avatarDriveFileId` into the request
- [x] 2.3 Manually test: open edit, change a field, save → data updates without error and reflects in the table

## 3. Member edit bug — backend DTO validation

- [x] 3.1 Create `hmti-backend/src/members/dto/update-member.dto.ts` with class-validator decorators; all fields optional; exclude immutable `nia`
- [x] 3.2 Type `PATCH /members/:id` handler as `@Body() dto: UpdateMemberDto` so the global `ValidationPipe` (whitelist + forbidNonWhitelisted) applies
- [x] 3.3 Pass the validated DTO to `membersService.update`; ensure unknown/invalid fields return 400 instead of a Prisma error
- [x] 3.4 Update/adjust any member controller/service tests to cover a valid edit and a rejected-extra-field case

## 4. Unclickable action buttons

- [x] 4.1 Remove the `transform: scale-[1.015]` applied to hovered `<tr>` in `Anggota.vue` (or move the hover effect to a non-transform style / inner cell)
- [x] 4.2 Ensure `SpeedDialNav` does not overlap table action buttons: add bottom clearance to the table/scroll area and/or adjust the FAB footprint/stacking so it never intercepts action clicks
- [x] 4.3 Verify action buttons (view/edit/delete) are clickable for all rows across desktop, tablet, and narrow/short window sizes

## 5. Domain reachability and HTTPS on VPS

- [x] 5.1 Confirm the live app path and current Nginx layout on the VPS (`/var/www/Project-web-HMTI` vs docs) and back up the existing Nginx config and database (`deploy/backup-hmti.sh`)
- [x] 5.2 Verify/add DNS `A` records for `hmti.my.id` and `www.hmti.my.id` → `163.61.58.127`; confirm propagation with an external DNS checker
- [x] 5.3 Configure Nginx `server_name hmti.my.id www.hmti.my.id;` for the frontend (and API location/subdomain as deployed); `nginx -t` before reload
- [x] 5.4 Issue TLS with `certbot --nginx -d hmti.my.id -d www.hmti.my.id`, enabling HTTP→HTTPS redirect and using `fullchain.pem` (complete chain for mobile)
- [x] 5.5 Update backend `CORS_ORIGINS` / `FRONTEND_URL` / `API_URL` and frontend API base URL to the real HTTPS domain; rebuild and redeploy
- [x] 5.6 Verify HTTPS loads with a valid trusted cert on desktop and mobile for both apex and `www`; test the chain with an SSL checker; confirm HTTP redirects
- [x] 5.7 Sync the working config back into `deploy/nginx-hmti.conf.example` so the repo matches production

## 6. Hardening and closeout

- [ ] 6.1 Rotate the VPS root password (and/or add SSH key auth) since the password was shared in chat
- [x] 6.2 Deploy all code changes (backend build+scp+`pm2 restart`, frontend build+scp) and run the full smoke test from the design's Migration Plan
- [x] 6.3 Confirm all four affected specs' scenarios pass; note rollback steps are in place
