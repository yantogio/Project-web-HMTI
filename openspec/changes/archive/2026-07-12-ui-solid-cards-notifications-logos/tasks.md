## 1. Solid popup/modal card surfaces

- [x] 1.1 Inventory every popup/modal in the frontend: grep each view for `fixed inset-0` overlays and note the card-surface class each uses (`themeClasses.cardGlass`, `modalContent`, inline `bg-*/NN`, `backdrop-blur`).
- [x] 1.2 Anggota.vue — confirm/make the edit modal and member-profile popup card surfaces solid (opaque dark/light bg), including inner panels using `/40`–`/50` opacity.
- [x] 1.3 HomeView.vue — make the officer profile popup and any other popup card surfaces solid.
- [x] 1.4 FinanceView.vue — make the transaction modal and generate-report modal card surfaces solid.
- [x] 1.5 Profile.vue — make any popup/modal card surfaces solid.
- [x] 1.6 DocsView.vue, ShowcaseHub.vue, AdminHome.vue, LoginView.vue — make popup/modal card surfaces solid.
- [x] 1.7 Ensure only modal/popup surfaces changed; leave translucent non-modal content cards (showcase/finance/docs lists) untouched.
- [x] 1.8 Verify the backdrop overlay behind each card stays dimmed/blurred and click-to-dismiss still works.

## 2. Profile toast notifications

- [x] 2.1 Import and initialize `useToast()` in Profile.vue.
- [x] 2.2 Replace biodata-flow `alert()` calls (success + failure) with matching `success`/`error` toasts, keeping existing Indonesian messages.
- [x] 2.3 Replace password-flow `alert()` calls (empty current password, mismatch, too short, success, server error) with matching `warning`/`error`/`success` toasts.
- [x] 2.4 Replace the profile-load and avatar-upload `alert()` calls with toasts for consistency.
- [x] 2.5 Confirm no `alert(` remains in Profile.vue.

## 3. Pengurus Inti card: jabatan + short bio

- [x] 3.1 In the HomeView officer card, move `officer.jabatan` above the name using the existing pill/badge classes (currently on `officer.role`).
- [x] 3.2 Replace the muted-subtext line below the name to render `officer.bio` (using the design currently applied to `officer.jabatan`), guarded with `v-if="officer.bio"`.
- [x] 3.3 Remove the standalone `officer.role` badge element.
- [x] 3.4 Verify `officer.bio` is present on the officer object (via the members API map) and the card layout holds when a member has no bio.

## 4. Dark-mode header logo outline

- [x] 4.1 In BrandLogo.vue, replace the dark-mode `drop-shadow` glow with a brighter multi-directional outline/edge applied only when `isDarkMode` is true (navbar variant and any header-used variant).
- [x] 4.2 Keep light-mode logo appearance unchanged.
- [x] 4.3 Tune outline radius/opacity so it reads as a clean bright edge (not a halo) against the darkest header background.
- [x] 4.4 Verify both HMTI and UBS logos are clearly legible in dark mode across all page headers.

## 5. Build, verify & deploy

- [x] 5.1 Run the frontend build and confirm it compiles with no errors.
- [x] 5.2 Manually verify all four changes in the running app (light + dark mode).
- [x] 5.3 Deploy to production VPS 163.61.58.127 following the existing deployment procedure (using the VPS password provided by the user).
- [x] 5.4 Smoke-check the deployed site: popup solidity, profile toasts, officer card bio, dark-mode logos.
