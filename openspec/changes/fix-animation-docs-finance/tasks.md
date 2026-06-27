## 1. AnimatedBackground — Light Mode Visibility Fix

- [x] 1.1 In `AnimatedBackground.vue`, update orb 0 light-mode class from `bg-primary-blue/35` to `bg-blue-600` and raise opacity from `opacity-25` to `opacity-40`
- [x] 1.2 Update orb 1 light-mode class from `bg-accent-orange/25` to `bg-orange-500` and raise opacity to `opacity-35`
- [x] 1.3 Update orb 2 light-mode class from `bg-amber-400/45` to `bg-amber-600` and raise opacity to `opacity-40`
- [x] 1.4 Update orb 3 light-mode class from `bg-primary-blue/20` to `bg-indigo-500` and raise opacity to `opacity-30`
- [x] 1.5 Update orb 4 light-mode class from `bg-accent-orange/15` to `bg-orange-600` and raise opacity to `opacity-30`
- [x] 1.6 Update orb 5 light-mode class from `bg-amber-300/40` to `bg-amber-700` and raise opacity to `opacity-35`
- [x] 1.7 Update orb 6 (light-only) from `bg-cream-dark/50` to `bg-blue-700` and raise opacity to `opacity-30`
- [ ] 1.8 Verify in browser that orbs are clearly visible in light mode and dark mode is unaffected

## 2. DocsView — Replace Native Dialogs with Toast/Confirm

- [x] 2.1 Add imports for `useToast` and `useConfirm` at the top of `DocsView.vue` `<script setup>`
- [x] 2.2 Destructure `{ success: toastSuccess, error: toastError, warning: toastWarning }` from `useToast()` and `{ confirm: confirmDialog }` from `useConfirm()`
- [x] 2.3 In `handleFileUpload`: replace `alert('Upload Berhasil, sob!')` with `toastSuccess('Upload berhasil!')`
- [x] 2.4 In `handleFileUpload`: replace both `alert(msg)` error calls with `toastError(msg)`
- [x] 2.5 In `deleteDoc`: replace `if (!confirm('Yakin mau hapus dokumen ini, sob?'))` with `const ok = await confirmDialog('Yakin mau hapus dokumen ini?'); if (!ok) return`
- [x] 2.6 In `deleteDoc`: make `deleteDoc` async-aware for the confirm dialog (ensure the function is already `async`)
- [x] 2.7 In `deleteDoc`: replace `alert('Berhasil dihapus!')` with `toastSuccess('Dokumen berhasil dihapus!')`
- [x] 2.8 In `deleteDoc`: replace `alert('Gagal hapus, cuk! Cek console.')` with `toastError('Gagal hapus dokumen.')`
- [x] 2.9 In `openGoogleDrivePreview`: replace `alert('Link preview tidak tersedia.')` with `toastWarning('Link preview tidak tersedia.')`

## 3. DocsView — Per-Tab File Upload Filtering

- [x] 3.1 Add a computed property `activeAccept` that returns the correct `accept` string based on `activeTab`:
  - `surat` → `'.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.ods,.odp'`
  - `media` → `'image/*,video/*,.psd,.ai,.fig,.sketch'`
  - `branding` → `'image/*,.psd,.ai,.fig,.sketch,.svg,.eps'`
- [x] 3.2 Update the hidden `<input type="file">` to use `:accept="activeAccept"` instead of the hardcoded `accept` string
- [ ] 3.3 Verify in browser that switching tabs changes the file picker filter (open picker in each tab and confirm only the expected formats are pre-selected in the OS dialog)

## 4. FinanceView — Config Save Auto-Refresh

- [x] 4.1 In `saveConfig`, after the `toastSuccess(...)` call and `fetchConfig()`, also call `fetchDuesList()` and `fetchDuesSummary()`
- [ ] 4.2 Verify that after saving config, the dues status panel updates immediately without a page reload

## 5. FinanceView — Replace prompt() with Inline Modal

- [x] 5.1 Add two new refs: `isGenerateModalOpen = ref(false)` and `generatePeriodInput = ref('')`
- [x] 5.2 Refactor `generateDues` to: set `generatePeriodInput` to the current `YYYY-MM`, set `isGenerateModalOpen = true`, and return (the modal confirm button will trigger the actual API call)
- [x] 5.3 Create a new async function `confirmGenerateDues` that reads `generatePeriodInput`, calls the API, shows success/error toast, calls `fetchDuesList()`, `fetchDuesSummary()`, `fetchTransactions()`, and sets `isGenerateModalOpen = false`
- [x] 5.4 Add the generate dues modal to the template after the existing transaction modal — a simple card with a text input for the period, a "Buat Tagihan" confirm button calling `confirmGenerateDues`, and a "Batal" button setting `isGenerateModalOpen = false`. Style consistent with the existing `isModalOpen` modal.
- [ ] 5.5 Verify in browser: clicking "Buat Tagihan Bulan Ini" opens the modal, confirm triggers the API and refreshes lists, cancel closes without API call
