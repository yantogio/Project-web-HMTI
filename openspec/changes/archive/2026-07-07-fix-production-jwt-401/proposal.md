# Proposal: fix-production-jwt-401

## Why

Setelah deploy ke VPS produksi (163.61.58.127), login berhasil tetapi hampir semua endpoint yang dilindungi autentikasi (`/api/dues`, `/api/finance/*`, `/api/transactions`, `/api/showcase`, `/api/members/me`, dll.) menolak request dengan **401 Unauthorized**, sehingga halaman Keuangan, Showcase Hub, dan Profil tidak bisa memuat data.

Akar masalah: **mismatch kunci JWT**. Token dibuat (signed) memakai `process.env.JWT_SECRET` di `auth.module.ts`, tetapi diverifikasi memakai string hardcoded `'HMTI_RAHASIA_KEY_JANGAN_DIBAGIKAN'` di `jwt.strategy.ts`. Panduan deploy (DEPLOYMENT.md / PRODUCTION_DEPLOYMENT.md) menginstruksikan mengisi `JWT_SECRET` produksi dengan nilai acak baru — sehingga di VPS kedua kunci berbeda dan setiap verifikasi token gagal. Di development masalah ini tidak terlihat karena `JWT_SECRET` lokal kebetulan sama / tidak diuji dengan secret berbeda.

## What Changes

- Satukan sumber kunci JWT: `JwtStrategy` membaca secret dari `process.env.JWT_SECRET` (sumber yang sama dengan `JwtModule.register`), bukan string hardcoded.
- Fail-fast saat startup: jika `JWT_SECRET` tidak diset, aplikasi menolak start dengan pesan error yang jelas (mencegah sign dengan `undefined` atau fallback diam-diam ke kunci dev).
- Hapus kunci rahasia hardcoded dari kode sumber (perbaikan keamanan — kunci itu sudah ter-commit ke repo).
- Dokumentasi deploy diperbarui: langkah verifikasi bahwa token login bisa dipakai memanggil endpoint ber-guard (mis. `curl /api/members/me` dengan Bearer token).

## Capabilities

### New Capabilities

- `jwt-auth-config`: Konfigurasi kunci JWT tunggal dari environment untuk pembuatan dan verifikasi token, dengan validasi startup.

### Modified Capabilities

_(tidak ada — spec kapabilitas yang ada tidak berubah perilakunya; ini perbaikan konsistensi autentikasi lintas endpoint)_

## Impact

- **Kode backend**: `hmti-backend/src/auth/jwt.strategy.ts` (secret dari env), `hmti-backend/src/auth/auth.module.ts` (validasi/penggunaan env yang sama), kemungkinan `main.ts` untuk validasi startup.
- **Deploy/VPS**: perlu rebuild (`npm run build`) dan restart PM2 di VPS; `.env` produksi harus berisi `JWT_SECRET`. Semua user harus login ulang setelah deploy (token lama yang ditandatangani dengan secret lama tetap tidak valid — ini diharapkan).
- **Frontend**: tidak ada perubahan (interceptor axios dan auth store sudah benar).
- **Keamanan**: kunci hardcoded yang bocor di repo tidak lagi dipakai; secret produksi hanya hidup di `.env` VPS.
