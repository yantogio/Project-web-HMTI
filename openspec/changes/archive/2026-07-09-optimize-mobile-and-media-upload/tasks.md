## 1. Batasi upload Media Event ke foto & video

- [x] 1.1 Di `DocsView.vue`, sederhanakan `activeAccept` untuk tab `media` menjadi `image/*,video/*` (hapus `.psd,.ai,.fig,.sketch`)
- [x] 1.2 Di `handleFileUpload` (`DocsView.vue`), tambahkan validasi: jika `activeTab === 'media'` dan `file.type` bukan `image/*` maupun `video/*`, panggil `toastError('Hanya foto dan video yang diperbolehkan di Media Event')` lalu `return` sebelum upload (berlaku untuk klik picker & drag-drop; reset `fileInput`)
- [x] 1.3 Di backend `documents.controller.ts` (atau `documents.service.ts`), tolak upload dengan `BadRequestException` bila `dto.type === 'MEDIA'` dan `file.mimetype` bukan `image/*`/`video/*`
- [ ] 1.4 Uji: upload PDF/PPT/XLSX di tab Media Event ditolak (client toast + server 400); upload gambar & video berhasil

## 2. Blok CSS mobile-perf terpusat (main.css)

- [x] 2.1 Di `hmti-frontend/src/assets/main.css`, tambahkan blok `@media (max-width: 767px) { ... }` khusus optimasi mobile (semua langkah di grup ini masuk ke dalamnya)
- [x] 2.2 Override `backdrop-filter: none` + `-webkit-backdrop-filter: none` untuk `.backdrop-blur-sm, .backdrop-blur, .backdrop-blur-md, .backdrop-blur-lg` (penyebab utama jank scroll)
- [x] 2.3 Nonaktifkan animasi latar looping: `animation: none` untuk `.aurora-light, .aurora-dark, .animate-blob, .animate-rise, .animate-sparkle, .animate-shoot, .animate-pulse-ring, .animate-spin-slow`
- [x] 2.4 Hilangkan filter blur orb besar: `filter: none` untuk `.blur-2xl, .blur-3xl`; sembunyikan `.noise-texture { display: none }`
- [x] 2.5 Tambahkan blok `@media (prefers-reduced-motion: reduce)` yang menonaktifkan animasi latar yang sama (menghormati preferensi OS di semua device)

## 3. Fallback keterbacaan kartu di mobile

- [x] 3.1 Audit kelas kartu/overlay yang mengandalkan transparansi + blur (mis. `bg-white/10`, `bg-white/20`, theme `cardGlass`/`nav`) via `grep -rn "backdrop-blur" src/`
- [x] 3.2 Untuk kartu transparan tersebut, beri latar solid/semi-solid fallback DI DALAM blok `@media (max-width: 767px)` agar teks tetap kontras saat blur mati (jangan sentuh style desktop)
- [ ] 3.3 Cek visual mobile: semua teks pada kartu/nav/modal tetap terbaca jelas di mode terang & gelap

## 4. Verifikasi

- [x] 4.1 Jalankan `npm run build` frontend tanpa error
- [ ] 4.2 Uji di DevTools device emulation (mobile ≤767px): Performance panel menunjukkan tidak ada repaint saat idle, dan scroll lebih mulus (FPS naik)
- [x] 4.3 Verifikasi desktop (≥768px) 100% tidak berubah: glass/backdrop-blur, animasi latar, dan semua fungsi tampil persis seperti sebelumnya di mode terang & gelap
- [ ] 4.4 Verifikasi fungsi inti tetap jalan di mobile: upload dokumen, tabel anggota, modal, navigasi

## 5. (Opsional) Peningkatan lanjutan

- [ ] 5.1 Jika masih terasa berat: tambahkan `content-visibility: auto` pada kartu/baris daftar panjang (Anggota, Finance) di dalam blok mobile
- [ ] 5.2 Optimalkan logo PNG (158KB) ke ukuran/format lebih ringan (webp) tanpa mengubah tampilan
