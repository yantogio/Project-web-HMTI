## Context

The project is a Vue 3 SPA (Vite + Tailwind) with three interconnected admin views. Two composables — `useToast` and `useConfirm` (in `src/composables/`) — provide a modern notification system already in use in `FinanceView`. `DocsView` was written earlier and never migrated to these composables. `AnimatedBackground.vue` uses `isDarkMode` prop to switch CSS classes and inline styles, but the light-mode values result in near-invisible elements. `FinanceView.generateDues` relies on a native `prompt()` which blocks the main thread and in some timing scenarios causes Vue's reactive dependency tracking to skip a batch update cycle, leaving the UI stale until reload.

## Goals / Non-Goals

**Goals:**
- Make animated background elements visible in light mode without touching dark mode
- Migrate DocsView alert/confirm dialogs to useToast/useConfirm
- Enforce per-tab file-type constraints on the hidden file input
- Refresh all affected data refs after saveConfig in FinanceView
- Replace generateDues `prompt()` with an inline modal (same pattern as the existing `isModalOpen` transaction modal)

**Non-Goals:**
- Backend changes of any kind
- Redesigning the AnimatedBackground component architecture
- Adding new documentation tab types
- Adding pagination or other features to any view

## Decisions

### 1. Light-mode animation: increase opacity + shift to darker color variants

**Decision:** Keep the same Tailwind color classes but replace low-opacity/pastel variants with saturated darker classes and raise base opacity.

**Rationale:** The dark-mode orbs use full-saturation classes (`bg-blue-600`, `bg-indigo-600`) at `opacity-25`. Light mode uses `/35`, `/25`, `/45`, `/15`, `/20`, `/40` alpha variants of `bg-primary-blue`, `bg-accent-orange`, `bg-amber-400` — all light-adjacent colors. Switching to `bg-blue-500`, `bg-indigo-500`, `bg-orange-500`, etc. and raising opacity to `0.40`–`0.55` gives the same "layered depth" look as dark mode but inverted.

**Alternative considered:** Add a CSS backdrop-filter or custom animation palette — rejected because it requires new Tailwind config keys and additional CSS, while a simple class/opacity swap achieves the goal with no new infrastructure.

### 2. DocsView notifications: drop-in composable replacement

**Decision:** Import `useToast` and `useConfirm` at the top of `DocsView`'s `<script setup>` and replace each `alert()`/`confirm()` call with the equivalent composable call — identical to how FinanceView uses them.

**Rationale:** Zero new infrastructure; the composables are already registered globally via `ToastContainer` in `App.vue`. Consistent UX across all pages. Requires adding `useConfirm` for the delete confirmation and `useToast` for upload/delete success/error messages.

### 3. DocsView per-tab file filtering: computed accept attribute + per-tab input

**Decision:** Replace the single static `accept=".pdf,.docx,.jpg,.jpeg,.png,.MP4"` on the hidden `<input type="file">` with a computed property `activeAccept` that returns different MIME/extension strings based on `activeTab`:

- `surat` (Arsip): `.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.ods,.odp`
- `media` (Media Event): `image/*,video/*,.psd,.ai,.fig,.sketch`
- `branding` (Branding Kit): `image/*,.psd,.ai,.fig,.sketch,.svg,.eps`

**Rationale:** The simplest approach is a single `<input>` with a `:accept="activeAccept"` binding. No structural change needed. The `accept` attribute is advisory (browsers show matching files by default) and the backend already validates MIME type on upload; this is a UX guard, not a security boundary.

**Alternative considered:** Three separate hidden inputs (one per tab) — rejected as unnecessary complexity when a single reactive `accept` binding achieves the same result.

### 4. FinanceView saveConfig: add missing fetch calls

**Decision:** After the `saveConfig` API call succeeds, call `fetchDuesList()` and `fetchDuesSummary()` in addition to the existing `fetchConfig()`.

**Rationale:** Config changes (dues amount, late fee, due day) affect how dues status is calculated and displayed in `duesSummaryList`. Without re-fetching, the status card shows stale data until the user refreshes.

### 5. FinanceView generateDues: replace prompt() with modal

**Decision:** Add a minimal inline modal (`isGenerateModalOpen` + `generatePeriodInput` refs) styled consistently with the existing transaction modal. The "Buat Tagihan Bulan Ini" button opens this modal instead of calling `prompt()`. On confirm, the API call proceeds and all three fetch functions are called.

**Rationale:** The native `prompt()` is synchronous, pauses Vue's reactivity scheduler, and is visually inconsistent. The existing modal pattern (see `isModalOpen` in FinanceView) is already proven and fits the UI. This modal needs only a single text input and two buttons — minimal implementation.

## Risks / Trade-offs

- [Risk] Raising orb opacity in light mode might make the background feel "heavy" on low-brightness screens → Mitigation: Keep opacity below 0.55 and maintain `blur-3xl` to keep them soft
- [Risk] `accept` attribute is not enforced by the browser at the OS file dialog level on all platforms → Mitigation: Backend MIME validation already exists; this is purely UX
- [Risk] Adding `fetchDuesList()` + `fetchDuesSummary()` after saveConfig adds two extra API calls → Mitigation: These are lightweight GET requests; acceptable cost for correctness

## Migration Plan

All changes are frontend-only and non-breaking. No migrations or feature flags required. Deployment is a standard `npm run build` + static file replace.
