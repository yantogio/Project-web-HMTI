## Why

Several UI details across the HMTI site reduce clarity and consistency: popup/modal cards render with translucent (blurred, semi-transparent) surfaces that let busy page content bleed through and hurt readability; the Profile page still uses native `alert()` dialogs instead of the standardized toast notifications used everywhere else; the "Pengurus Inti" cards on HomeView show a redundant Role badge (the position is already conveyed by `jabatan`) while the more useful short bio is hidden inside the profile popup; and in dark mode the HMTI and Universitas Bani Saleh logos in every page header blend into the dark background and are hard to see.

## What Changes

- Make every popup/modal **card surface** solid (opaque) instead of translucent across all pages (HomeView through Profile). Only the card surface changes — the dimmed/blurred backdrop overlay behind the card stays as-is.
- Replace the Profile page's native `alert()` notifications (both "ubah biodata" and "ubah password" flows) with the standard toast notification template used elsewhere in the app.
- On the HomeView "Pengurus Inti" card, remove the redundant Role badge and surface the member's short bio instead. Swap the layout/design of the two lines: **above the name** show `jabatan` using the current Role-badge (pill) design; **below the name** show the short bio using the current `jabatan` (muted subtext) design.
- In dark mode, add a bright outline / edge treatment to the HMTI and UBS logos in every page header so both logos remain clearly visible against dark backgrounds.
- Deploy the completed changes to the production VPS (163.61.58.127) following the existing deployment procedure.

## Capabilities

### New Capabilities
- `solid-modal-surfaces`: All popup/modal card surfaces render with a solid (opaque) background in both light and dark mode, while the backdrop overlay remains dimmed/blurred.
- `profile-toast-notifications`: The Profile page reports success and error outcomes for biodata and password changes through the shared toast notification system.
- `officer-bio-display`: The HomeView "Pengurus Inti" card shows `jabatan` as the pill badge above the name and the member's short bio as muted subtext below the name, with no separate Role badge.
- `dark-mode-logo-legibility`: In dark mode, header logos (HMTI and UBS) receive a bright outline/edge so they stay clearly legible against dark backgrounds.

### Modified Capabilities
<!-- No existing spec's requirements change; these are additive UI behaviors. -->

## Impact

- **Frontend views**: `HomeView.vue`, `Anggota.vue`, `Profile.vue`, `FinanceView.vue`, `DocsView.vue`, `ShowcaseHub.vue`, `AdminHome.vue`, `LoginView.vue` (modal/popup card surfaces).
- **Frontend components**: `BrandLogo.vue` (dark-mode logo outline), `ToastContainer.vue` / `useToast.js` (Profile notifications reuse existing template — no changes expected).
- **No backend, API, or data-model changes.**
- **Deployment**: Production VPS `163.61.58.127` — rebuild frontend and publish per existing deploy procedure.
