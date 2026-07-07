# Tasks: fix-production-jwt-401

## 1. Perbaikan Kode Backend

- [x] 1.1 Ubah `hmti-backend/src/auth/jwt.strategy.ts`: ganti `secretOrKey` hardcoded menjadi `process.env.JWT_SECRET`, dengan throw error jelas jika kosong
- [x] 1.2 Ubah `hmti-backend/src/auth/auth.module.ts`: tambahkan validasi fail-fast bila `process.env.JWT_SECRET` kosong (jangan fallback diam-diam)
- [x] 1.3 Pastikan tidak ada sisa string `HMTI_RAHASIA_KEY_JANGAN_DIBAGIKAN` di seluruh kode sumber (grep)
- [x] 1.4 Tambahkan/perbarui `JWT_SECRET` di `.env.example` atau dokumentasi setup dev agar developer lokal tidak gagal startup

## 2. Verifikasi Lokal

- [x] 2.1 Jalankan backend lokal dengan `JWT_SECRET` diset; login, lalu panggil `GET /api/members/me` dan `GET /api/dues` dengan Bearer token — harus 200
- [x] 2.2 Uji negatif: jalankan tanpa `JWT_SECRET` — aplikasi harus gagal start dengan pesan jelas
- [x] 2.3 Uji negatif: panggil endpoint ber-guard dengan token yang di-sign kunci lain — harus 401

## 3. Deploy ke VPS

- [x] 3.1 Pastikan `.env` produksi di VPS berisi `JWT_SECRET` (nilai acak yang sudah ada, tidak perlu diganti)
- [x] 3.2 Tarik perubahan ke VPS, `npm run build` di `hmti-backend`, lalu `pm2 restart hmti-backend`
- [x] 3.3 Verifikasi produksi: login lewat browser di `http://163.61.58.127`, buka halaman Keuangan, Showcase Hub, dan Profil — data harus termuat tanpa error 401 di console
- [x] 3.4 Informasikan pengguna bahwa semua orang perlu login ulang setelah deploy

## 4. Dokumentasi

- [x] 4.1 Perbarui DEPLOYMENT.md / PRODUCTION_DEPLOYMENT.md: tambahkan langkah verifikasi pasca-deploy (`curl` endpoint ber-guard dengan token login harus 200)
