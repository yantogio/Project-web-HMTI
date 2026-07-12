## Context

The frontend is a Vue 3 SPA (`hmti-frontend`) styled with Tailwind utility classes and a per-view `themeClasses` object that switches between light and dark mode. Modal/popup card surfaces are built from a shared translucent class (e.g. `themeClasses.cardGlass` = `bg-slate-800/50 border-white/10`, `bg-slate-950/40` inner panels, `backdrop-blur`), which lets busy page content show through. Some modals already use solid surfaces (`Anggota.vue` `modalContent` = `bg-slate-900` / `bg-white`, the member profile popup uses `bg-slate-900` / `bg-white`), so the target look already exists in-repo and can be used as the reference.

The Profile page (`Profile.vue`) uses native `alert()` for all outcomes, while the rest of the app uses the shared `useToast()` composable rendered by `ToastContainer.vue`. HomeView's "Pengurus Inti" card renders `officer.role` as a pill badge above the name and `officer.jabatan` as muted subtext below it; `officer.bio` already exists on the officer object (used in the officer profile popup) but is not shown on the card. Header logos are rendered by `BrandLogo.vue`, which in dark mode only applies a soft white `drop-shadow` glow — not enough separation on dark backgrounds.

## Goals / Non-Goals

**Goals:**
- Solid, opaque surfaces for all popup/modal cards across every view, in both themes, keeping the dimmed/blurred backdrop overlay behind the card.
- Profile biodata and password flows report via the standard toast template instead of `alert()`.
- Pengurus Inti card shows `jabatan` (pill design, above name) and short bio (muted subtext, below name); Role badge removed.
- Dark-mode header logos get a bright, clearly visible outline/edge.
- Deploy to production VPS following the existing procedure.

**Non-Goals:**
- No backend/API/data-model changes.
- No change to the backdrop overlay dimming/blur behavior.
- No redesign of modal layout, headers, or content beyond surface opacity.
- No change to light-mode logo appearance.

## Decisions

- **Solid surfaces via a shared solid class, not per-element edits.** Where a view routes modal surfaces through a `themeClasses` key (e.g. `cardGlass` when used as a modal body, or `modalContent`), switch that surface to an opaque token (`bg-slate-900` dark / `bg-white` light, keeping existing borders). For inner modal panels using `/40`–`/50` opacity, drop the alpha to a solid slate shade. *Alternative considered:* a single global CSS override — rejected because `cardGlass` is intentionally translucent for non-modal cards (e.g. showcase/finance content cards) and a blanket override would flatten those too. We scope changes to popup/modal surfaces only.
- **Reuse the existing toast system for Profile.** Import `useToast()` in `Profile.vue` and replace each `alert(...)` with the matching `success` / `warning` / `error` call, mirroring how other views phrase them. No new component is built. *Alternative:* build a bespoke Profile notice — rejected as duplication.
- **Officer card: swap fields and designs, keep both style classes.** Above the name, render `officer.jabatan` using the existing pill/badge classes (currently on `officer.role`). Below the name, render `officer.bio` using the existing muted-subtext classes (currently on `officer.jabatan`). Remove the `officer.role` element. Guard the bio with `v-if` so members without a bio don't render an empty line. `officer.bio` already flows from the members API through the `officers.value.map(...)` spread, so no data plumbing is needed.
- **Dark-mode logo legibility via a stronger, multi-directional bright edge in `BrandLogo.vue`.** Replace the single soft dark-mode `drop-shadow` with a brighter outline effect (layered white `drop-shadow` in multiple directions, or an equivalent bright edge) applied only when `isDarkMode` is true. Because all headers use `BrandLogo`, editing the component covers every page in one place. *Alternative:* a solid pill/background behind the logos — rejected as visually heavier and inconsistent with the current transparent-logo look.

## Risks / Trade-offs

- **`cardGlass` is shared between modal and non-modal cards** → Only change the surface where it backs a popup/modal; leave translucent content cards (showcase/finance/docs lists) untouched. Verify each view visually after editing.
- **Missed modal surfaces** → Enumerate every `fixed inset-0` overlay per view during implementation and confirm each card surface is opaque; the tasks list tracks views explicitly.
- **Logo outline too strong/haloed** → Tune the drop-shadow radius/opacity so the edge reads as a clean outline, not a glow blob; check against the darkest header background.
- **Toast wording drift** → Keep the existing Indonesian messages from the current `alert()` calls so behavior/text is familiar.

## Migration Plan

Frontend-only, no data migration. After implementation: build the frontend and deploy to VPS `163.61.58.127` per `PRODUCTION_DEPLOYMENT.md` / existing deploy scripts (user will supply the VPS password at deploy time). Rollback = redeploy the previous build / revert the commit.

## Open Questions

- None blocking. Exact opaque shades and outline radius will be tuned to match existing solid modals during implementation.
