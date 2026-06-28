## Why

Foto profil yang diupload anggota di halaman Profil tidak ditampilkan di halaman Anggota dan HomeView, sehingga kedua halaman tersebut masih menampilkan avatar generik dari `ui-avatars.com`. Selain itu, penyimpanan lokal (`uploads/avatars/`) tidak cocok untuk deployment—file bisa hilang saat server restart dan tidak scalable. Perlu migrasi ke Google Drive (mengikuti sistem dokumen yang sudah ada) dan integrasi tampilan avatar ke seluruh halaman.

## What Changes

- **Halaman Anggota**: Tampilkan `avatarUrl` dari API sebagai foto profil di tabel anggota dan modal detail; fallback ke inisial jika tidak ada foto.
- **Halaman HomeView**: Tampilkan `avatarUrl` dari API di carousel pengurus; fallback ke inisial jika tidak ada foto.
- **Backend – Storage Avatar**: Ganti penyimpanan lokal (`diskStorage` + `ServeStaticModule`) dengan Google Drive menggunakan `GoogleDriveService` yang sudah ada.
- **Backend – Multer**: Ganti `diskStorage` ke `memoryStorage` agar file dikirim sebagai buffer ke Google Drive.
- **Backend – Prisma**: Tambah field `avatarDriveFileId String?` ke model `Member` untuk menyimpan Drive file ID (digunakan saat hapus file lama).
- **Backend – Env**: Tambah `FOLDER_ID_AVATARS` di `.env` yang mengarah ke folder "Foto Profil Anggota" di Google Drive WEB HMTI.
- Hapus dependency `ServeStaticModule` untuk folder `uploads/` (tidak lagi dibutuhkan untuk avatar).

## Capabilities

### New Capabilities

- `avatar-gdrive-storage`: Upload dan hapus foto profil anggota via Google Drive, menyimpan URL publik Drive dan file ID di database.

### Modified Capabilities

- `avatar-display`: Tampilan foto profil anggota di semua halaman (Profil, Anggota, HomeView) menggunakan sumber URL yang sama dari database.

## Impact

- `hmti-backend/prisma/schema.prisma` — tambah field `avatarDriveFileId`
- `hmti-backend/src/members/members.module.ts` — ganti ke `memoryStorage`, inject `GoogleDriveService`
- `hmti-backend/src/members/members.service.ts` — update `updateAvatar` pakai Drive
- `hmti-backend/src/app.module.ts` — hapus atau pertahankan `ServeStaticModule` (opsional jika masih ada file lokal lama)
- `hmti-backend/.env` — tambah `FOLDER_ID_AVATARS`
- `hmti-frontend/src/views/HomeView.vue` — update mapping officer untuk pakai `avatarUrl`
- `hmti-frontend/src/views/Anggota.vue` — ganti `official_photo_url` → `avatarUrl`
