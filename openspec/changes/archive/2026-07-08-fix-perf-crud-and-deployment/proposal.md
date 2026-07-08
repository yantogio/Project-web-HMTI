## Why

The HMTI system has five user-reported defects that block real usage: the animated background makes the site crawl on mobile, admins cannot edit member data, action buttons in the member table are frequently unclickable, and the production domain (`hmti.my.id` / `www.hmti.my.id`) is unreachable on mobile browsers and has no working HTTPS. These issues affect core admin workflows and the public reachability of the site, so they need to be fixed and the system optimized before continued use.

## What Changes

- **Mobile performance**: Drastically reduce the always-on GPU cost of `AnimatedBackground.vue`. Cut the number of blurred orbs/particles/rings on small screens, honor `prefers-reduced-motion`, and disable the mouse-parallax listener on touch/mobile devices so scrolling and interaction are smooth.
- **Member edit bug (BREAKING behavior fix)**: The frontend currently PATCHes the entire member object (`{ ...member }`, including `password`, `joinedAt`, `avatarUrl`, etc.) to `/members/:nia`, which Prisma rejects. Change the edit flow to send only editable fields, and add an `UpdateMemberDto` on the backend so `/members/:id` validates and whitelists input instead of accepting `any`.
- **Unclickable action buttons**: The `SpeedDialNav` floating button is `fixed bottom-6 left-6 z-50` and overlaps the left-hand "Aksi" column of the member table, intercepting clicks (worse on resize/short viewports). Resolve the z-index/overlap and remove the fragile `transform: scale` applied to `<tr>` rows so action buttons are always clickable.
- **Domain not reachable on mobile / no HTTPS**: Diagnose and fix DNS records for `hmti.my.id` and `www.hmti.my.id` (A/AAAA, `www` subdomain, propagation), configure Nginx server blocks for both apex and `www`, and issue/renew a valid TLS certificate (Certbot/Let's Encrypt) so the site loads over HTTPS across desktop and mobile browsers.
- **General optimization**: Apply straightforward production wins uncovered during the fixes (e.g. asset/caching, correct CORS/redirect for the real domain).

## Capabilities

### New Capabilities
- (none — all changes modify existing capabilities)

### Modified Capabilities
- `animated-background`: Add explicit mobile/reduced-motion performance requirements that cap animated element count and disable parallax on touch devices.
- `member-management`: Member update must accept only a validated, whitelisted set of editable fields; editing an existing member must succeed.
- `mobile-responsive-ui`: Admin action controls (member table) must remain clickable at all viewport sizes and must not be obscured by floating navigation.
- `vps-production-operations`: Production must serve the real `hmti.my.id` and `www.hmti.my.id` domains over valid HTTPS, reachable from mobile browsers.

## Impact

- **Frontend**: `hmti-frontend/src/components/AnimatedBackground.vue`, `hmti-frontend/src/components/SpeedDialNav.vue`, `hmti-frontend/src/views/Anggota.vue`.
- **Backend**: `hmti-backend/src/members/members.controller.ts`, new `hmti-backend/src/members/dto/update-member.dto.ts`, `members.service.ts`.
- **Infrastructure (VPS 163.61.58.127)**: DNS provider records for `hmti.my.id`; Nginx site config (`deploy/nginx-hmti.conf.example` → live config); Certbot TLS certificates; PM2/Nginx reload. No database schema changes.
- **Security**: Move member update off `@Body() data: any` to a validated DTO. VPS password shared in chat must be rotated after this work.
