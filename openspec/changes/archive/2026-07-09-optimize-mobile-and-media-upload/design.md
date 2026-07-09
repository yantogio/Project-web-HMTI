## Context

Aplikasi HMTI (Vue 3 + Tailwind, backend NestJS) terasa berat di mobile. Profiling manual atas kode mengungkap penyebabnya adalah **biaya kompositing/repaint GPU**, bukan JS/network (bundle sudah lazy-loaded & wajar). Tiga sumber utama:

1. `backdrop-blur` dipakai 66x, termasuk di theme class `cardGlass` dan `nav` yang di-*reuse* di hampir setiap kartu dan navbar sticky. `backdrop-blur` memaksa GPU me-*resample & blur* seluruh area di belakang elemen tiap frame — sangat mahal di HP, terutama saat elemen sticky ikut scroll.
2. `AnimatedBackground.vue` sudah punya gating (`richBackground` off di mobile), tapi **layer dasar tetap selalu aktif**: `aurora` gradient menganimasikan `background-position` terus-menerus, ada 3 orb `filter: blur-2xl`, dan `noise-texture` dengan `mix-blend-mode: overlay`. Ini menimbulkan repaint kontinu walau layar diam.
3. `transition-all` dipakai ~161x; pada elemen berulang (baris tabel) ini memicu style recalc berlebih.

Selain performa, tab **Media Event** di `DocsView.vue` mengizinkan upload tipe apa pun karena `handleFileUpload` ([DocsView.vue:137](../../../hmti-frontend/src/views/DocsView.vue#L137)) tidak memvalidasi tipe — atribut `accept` hanya saran picker. Backend (`documents.controller.ts`) juga belum memvalidasi MIME terhadap `dto.type`.

## Goals / Non-Goals

**Goals:**
- Scroll & interaksi mulus di mobile dengan menghilangkan re-blur per frame dan repaint latar kontinu.
- Mempertahankan tampilan glass & animasi kaya di desktop tanpa perubahan visual.
- Menegakkan (client + server) bahwa tab Media Event hanya menerima `image/*` dan `video/*`.

**Non-Goals:**
- Redesign visual atau perubahan tema desktop.
- Optimasi bundle/JS splitting (sudah memadai).
- Konversi aset gambar ke webp (opsional, dicatat sebagai peningkatan minor, di luar cakupan inti).

## Decisions

**D0 — Semua perubahan performa dikurung dalam `@media (max-width: 767px)` (Pendekatan B).**
Alih-alih mengedit theme-class `backdrop-blur`/animasi di ~10 file view (Pendekatan A, berisiko mengubah baris yang juga dipakai desktop), seluruh optimasi ditulis sebagai **satu blok CSS terpusat di `main.css`** di dalam `@media (max-width: 767px)` (+ `@media (prefers-reduced-motion: reduce)`). Alasan: media query `max-width: 767px` **mustahil** dieksekusi pada viewport desktop, sehingga desktop dijamin identik; dan karena hanya properti kosmetik yang di-override, tidak ada risiko ke logika/DOM/fungsi. Lebih sedikit titik edit, lebih mudah di-review.
*Alternatif ditolak (Pendekatan A):* edit `md:backdrop-blur` per view — menyentuh baris bersama desktop, butuh regression-test desktop menyeluruh, tersebar di banyak file.

**D1 — Matikan `backdrop-filter` di mobile (dampak terbesar).**
Di dalam blok mobile, override semua utilitas `.backdrop-blur-sm/.backdrop-blur/.backdrop-blur-md/.backdrop-blur-lg` dengan `backdrop-filter: none` + `-webkit-backdrop-filter: none`. Untuk kartu yang mengandalkan transparansi (mis. `bg-white/10`) tambahkan latar solid fallback khusus mobile agar kontras teks tetap aman. Ini menghapus re-blur latar per frame — penyebab utama jank scroll.

**D2 — Hentikan animasi & efek latar mahal di mobile.**
Di blok mobile & reduced-motion: `animation: none` untuk `.aurora-light/.aurora-dark`, `.animate-blob`, `.animate-rise`, `.animate-sparkle`, `.animate-shoot`, `.animate-pulse-ring`, `.animate-spin-slow`; `filter: none` untuk orb `.blur-2xl/.blur-3xl`; `display: none` untuk `.noise-texture` (`mix-blend-mode`). Hasil: gradient statis murah, nol repaint saat idle. AnimatedBackground tak perlu diubah — gating CSS sudah menon-aktifkan efeknya; opsional bersihkan DOM residual bila mudah.
*Alternatif ditolak:* menurunkan durasi animasi (tetap repaint kontinu).

**D3 — (Opsional) `content-visibility: auto` untuk daftar panjang.**
Bila masih terasa berat, tambahkan `content-visibility: auto` pada kartu/baris daftar (Anggota, Finance) di dalam blok mobile agar elemen off-screen tidak dirender. Murni CSS, desktop-safe. Dijadikan langkah lanjutan bila diperlukan, bukan wajib.

**D4 — Validasi upload media di dua lapis.**
Client (`handleFileUpload`): sebelum `uploadDocument`, jika `activeTab === 'media'` dan `!(file.type.startsWith('image/') || file.type.startsWith('video/'))` → `toastError` dan batal. Sederhanakan `activeAccept` media menjadi `image/*,video/*`.
Server (`documents.controller.ts` / `documents.service.ts`): jika `dto.type === 'MEDIA'` dan `file.mimetype` bukan image/video → `BadRequestException`. Ini mencegah bypass via request langsung.
*Alternatif ditolak:* hanya client-side (mudah di-bypass) atau hanya server-side (UX buruk, upload gagal setelah transfer).

## Risks / Trade-offs

- **[Fallback non-blur mengubah nuansa kartu di mobile]** → Pilih latar solid dengan opacity tinggi (`bg-white/95`, dark setara) agar tetap konsisten & teks terbaca; blur memang nyaris tak terlihat di layar kecil.
- **[Override `!important` di blok mobile]** → Diperlukan untuk mengalahkan utility Tailwind inline; risiko rendah karena scope terkunci `max-width: 767px` dan hanya menyasar properti kosmetik spesifik.
- **[Kartu transparan tanpa blur jadi kurang kontras]** → Audit tiap kelas transparan (`bg-*/10`, `bg-*/20`) dan beri fallback solid mobile bila perlu.
- **[Perubahan validasi menolak file yang dulu diterima]** → Sesuai tujuan; komunikasikan lewat toast yang jelas.

## Migration Plan

1. Terapkan perubahan frontend (CSS/theme-class + AnimatedBackground + DocsView) dan backend (validasi MIME).
2. Verifikasi lokal: DevTools device emulation + Performance panel (cek repaint idle = nol, scroll FPS naik).
3. `npm run build` frontend, build backend, deploy ke VPS (lihat memory deployment).
4. **Rollback:** perubahan bersifat CSS/logika terisolasi; `git revert` commit ini aman tanpa migrasi data.

## Open Questions

- Apakah perlu sekaligus mengonversi logo PNG (158KB) ke webp? (peningkatan minor, bisa menyusul).
- Perlukah menonaktifkan `noise-texture` sepenuhnya di semua device, atau cukup di mobile? (default: mobile-only, desktop tetap).
