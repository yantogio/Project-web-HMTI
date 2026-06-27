## Context

Sistem avatar saat ini menyimpan file foto profil secara lokal di `hmti-backend/uploads/avatars/` dan serving via `ServeStaticModule`. Dua halaman utama (Anggota, HomeView) masih menggunakan `ui-avatars.com` sebagai fallback karena belum mengonsumsi field `avatarUrl` dari API. Sistem dokumen sudah menggunakan `GoogleDriveService` yang proven untuk upload, permission publik, dan hapus file di Google Drive.

## Goals / Non-Goals

**Goals:**
- Semua halaman (Profil, Anggota, HomeView) menampilkan foto profil yang sama dari sumber tunggal (`avatarUrl` di database)
- Upload foto profil disimpan ke Google Drive folder "Foto Profil Anggota"
- File lama di Google Drive dihapus otomatis saat anggota ganti foto
- Fallback ke inisial nama (bukan eksternal URL) jika `avatarUrl` null

**Non-Goals:**
- Cropping/resize foto di frontend
- Multiple foto per anggota
- Migrasi file lokal lama yang sudah ada ke Google Drive

## Decisions

**D1: Gunakan `memoryStorage` untuk Multer**
File avatar diterima sebagai buffer di memory dan langsung dikirim ke Google Drive via `Readable.from(file.buffer)`. Ini konsisten dengan pola yang sudah digunakan di `documents.service.ts`. Tidak ada file sementara yang perlu dibersihkan.

**D2: Tambah field `avatarDriveFileId` di Prisma `Member`**
Untuk menghapus file lama di Google Drive saat ganti foto, perlu menyimpan Drive file ID terpisah. Field `avatarUrl` menyimpan URL publik, `avatarDriveFileId` menyimpan ID untuk operasi Drive API. Kedua field nullable.

**D3: URL avatar = `https://drive.google.com/thumbnail?id=<fileId>&sz=w400`**
Format ini menghasilkan URL gambar langsung yang bisa digunakan di `<img src>` tanpa autentikasi. Lebih stabil daripada `webContentLink` (yang men-trigger download) dan `webViewLink` (yang membuka Drive viewer). URL ini di-construct di service, tidak bergantung pada response Drive API yang bisa berubah format.

**D4: Inject `GoogleDriveService` ke `MembersModule` langsung**
Reuse service yang sama tanpa membuat service baru. Tambahkan `GoogleDriveService` sebagai provider di `MembersModule`. Ini konsisten dengan arsitektur NestJS yang ada.

**D5: `ServeStaticModule` tetap dipertahankan di `app.module.ts`**
File lokal lama (jika ada) tidak dimigrasi, tapi `ServeStaticModule` tetap ada agar URL lokal lama tidak broken. Ini backward-compatible dan tidak mengganggu deployment.

**D6: Anggota.vue — ganti `official_photo_url` → `avatarUrl`**
Field `official_photo_url` tidak ada di API response. API `GET /members` sudah mengembalikan `avatarUrl` (dari `findMany()` tanpa filter). Tinggal ganti nama field di template.

**D7: HomeView.vue — update mapping officer**
Saat ini `officers` array di-map dengan `img: ui-avatars.com`. Ubah agar `img` mengambil `avatarUrl` jika tersedia, fallback ke `ui-avatars.com`. Tidak perlu ubah template HTML karena sudah pakai `officer.img`.

## Risks / Trade-offs

- [Risk] Google Drive rate limit saat banyak anggota upload serentak → Mitigation: Multer limit 2MB masih berlaku, dan Drive API limit jarang tercapai untuk skala organisasi mahasiswa
- [Risk] `thumbnailLink` dari Drive bisa expire → Mitigation: Gunakan format URL konstruksi manual (`thumbnail?id=...`) yang tidak expire selama file publik
- [Risk] File lokal lama menjadi orphan → Mitigation: Diterima; anggota yang ganti foto akan otomatis upload ke Drive, file lokal lama diabaikan

## Migration Plan

1. Tambah `avatarDriveFileId` ke schema, jalankan migrasi Prisma
2. Update backend (module, service) untuk pakai Drive
3. Tambah `FOLDER_ID_AVATARS` ke `.env`
4. Update frontend (Anggota.vue, HomeView.vue)
5. Restart backend — anggota yang upload foto baru akan tersimpan ke Drive

**Rollback:** Kembalikan `members.module.ts` ke `diskStorage` dan revert `members.service.ts`. Data `avatarUrl` lama (lokal) masih valid jika `ServeStaticModule` tetap ada.
