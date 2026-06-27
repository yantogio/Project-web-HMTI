## Why

Three UX regressions exist across the app: the animated background is invisible in light mode (low-contrast animations against a light background), the Dokumentasi page still uses native `alert()`/`confirm()` dialogs and has undifferentiated file-type filters per tab, and the Keuangan page requires a manual page refresh after some operations because not all fetch calls are triggered upon success.

## What Changes

- **AnimatedBackground (light mode)**: Increase orb opacity and darken orb colors in light mode so animations are clearly visible against the cream/white background — mirroring the dark mode where bright elements show clearly on dark.
- **DocsView — notifications**: Replace all `alert()` and `confirm()` calls with the existing `useToast` / `useConfirm` composables, consistent with every other page.
- **DocsView — file upload filters**: The single hidden `<input type="file">` has a fixed `accept` attribute. Split into per-tab accept values: Arsip (PDF/Word/PPT/Excel/etc.), Media Event (images/video/design files), Branding Kit (images/design only, no video).
- **FinanceView — data refresh**: After `saveConfig` succeeds, also call `fetchDuesList()` and `fetchDuesSummary()` so the dues status list reflects the new config immediately. Replace the native `prompt()` in `generateDues` with an inline modal input, preventing the browser-dialog-induced reactivity stall that causes stale UI.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `animated-background`: Light-mode visibility fix — orb colors and opacities updated so animations are visible on light backgrounds.
- `docs-view`: Notification system upgrade (toast/confirm) and per-tab upload file-type filtering.
- `finance-view`: Auto-refresh after config save; replace `prompt()` with a proper inline modal for period input.

## Impact

- `hmti-frontend/src/components/AnimatedBackground.vue` — light-mode orb/particle color and opacity values
- `hmti-frontend/src/views/DocsView.vue` — add `useToast`/`useConfirm` imports, replace native dialogs, split file `accept` attribute per tab
- `hmti-frontend/src/views/FinanceView.vue` — `saveConfig` post-save fetches, `generateDues` modal replacement
- No backend changes required
- No new dependencies
