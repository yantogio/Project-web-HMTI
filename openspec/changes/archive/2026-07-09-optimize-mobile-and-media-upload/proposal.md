## Why

Aplikasi admin HMTI terasa sangat berat di perangkat mobile. Investigasi menunjukkan penyebabnya bukan ukuran bundle JS (sudah wajar & lazy-loaded), melainkan **beban kompositing GPU yang berlebihan**: puluhan elemen `backdrop-blur` pada kartu & navbar sticky, ditambah latar animasi (`aurora`, orb `blur`, `noise` blend-mode) yang selalu aktif walau layar diam. Selain itu, tab **Media Event** di halaman Dokumentasi masih bisa dipakai untuk mengunggah PPT, Excel, dan PDF karena upload tidak divalidasi tipe filenya — atribut `accept` hanya saran picker yang mudah di-bypass.

Pendekatan yang dipilih: **satu blok CSS mobile-perf terpusat di dalam `@media (max-width: 767px)`**, bukan mengedit theme-class per view. Media query ini secara harfiah tidak pernah dieksekusi pada viewport ≥ 768px, sehingga **desktop dijamin tidak berubah sama sekali**, dan semua perubahan bersifat kosmetik (CSS) tanpa menyentuh logika/JS/DOM sehingga fungsi yang sudah berjalan tetap aman.

- **Matikan `backdrop-filter` (backdrop-blur) di mobile**: seluruh kelas `backdrop-blur-*` di-override `backdrop-filter: none` pada viewport mobile, dengan latar solid fallback agar teks tetap terbaca. Ini menghilangkan re-blur latar per frame — penyebab utama scroll patah-patah.
- **Hentikan animasi latar yang selalu aktif di mobile**: animasi `aurora`, `blob`, particles, sparkle, shooting star, pulse-ring, dan `noise mix-blend-mode` dinonaktifkan pada viewport mobile & `prefers-reduced-motion`, menyisakan gradient statis yang murah (tanpa repaint saat idle).
- **Hilangkan `filter: blur` orb besar di mobile**: orb `blur-2xl/3xl` di-override `filter: none` (atau diganti gradient radial statis).
- **Batasi upload tab Media Event ke video & foto saja (BUKAN sekadar hint)**: `handleFileUpload` SHALL memvalidasi tipe file secara eksplisit; ketika tab aktif `media`, hanya `image/*` dan `video/*` yang diterima, tipe lain (PDF/PPT/Excel/desain) ditolak dengan toast error — divalidasi di klik picker maupun drag-and-drop, dan diperkuat di backend.

## Capabilities

### New Capabilities
- `mobile-performance`: Persyaratan lintas-halaman untuk membatasi biaya rendering/kompositing GPU pada viewport mobile (gating `backdrop-blur` dan efek animasi mahal), menjaga scroll & interaksi tetap mulus.

### Modified Capabilities
- `animated-background`: Layer latar yang selama ini selalu dirender/animasi (aurora, orb blur, noise blend) diringankan atau dihentikan animasinya pada mobile & reduced-motion.
- `docs-view`: Tab Media Event SHALL menegakkan (bukan hanya menyaring picker) upload hanya untuk `image/*` dan `video/*`; tipe file lain ditolak sebelum dikirim ke server, dengan penegakan tambahan di backend.

## Impact

- **Frontend**:
  - `hmti-frontend/src/assets/main.css` — **titik utama**: tambah blok `@media (max-width: 767px)` + `@media (prefers-reduced-motion: reduce)` yang me-override backdrop-filter, filter blur, mix-blend, dan animasi latar. Ini menggantikan kebutuhan mengedit banyak file view.
  - Penyesuaian latar solid minimal untuk kartu yang tadinya mengandalkan blur (mis. `bg-white/10`) agar teks tetap terbaca saat blur mati di mobile — tetap dalam scope media query mobile.
  - `hmti-frontend/src/views/DocsView.vue` — validasi tipe file di `handleFileUpload`.
- **Backend**: endpoint upload dokumen (`documents.controller.ts`) — validasi MIME server-side untuk `type=MEDIA` (hanya image/video).
- **Tidak breaking**: seluruh perubahan performa terkurung di `max-width: 767px` sehingga desktop tak tersentuh; tidak ada logika/JS/DOM yang diubah; hanya aturan validasi upload yang lebih ketat.
