## Context

Aplikasi HMTI menggunakan NestJS (backend) + Vue 3 (frontend) dengan SQLite via Prisma. Model `Member` sudah memiliki field teks seperti `name`, `email`, `bio`, dll. Halaman `Profile.vue` sudah mengonsumsi endpoint `GET/PATCH /members/me`. Saat ini belum ada mekanisme upload file di backend dan belum ada field foto di database.

## Goals / Non-Goals

**Goals:**
- Tambah endpoint `PATCH /members/me/avatar` yang menerima file gambar via multipart/form-data
- Simpan file foto di direktori lokal `hmti-backend/uploads/avatars/` dengan nama unik (berbasis NIA + timestamp)
- Expose file foto melalui static serving di URL `/uploads/avatars/<filename>`
- Tambah kolom `avatarUrl String?` pada model `Member` di Prisma
- Tampilkan foto profil di `Profile.vue` dengan fallback ke avatar inisial jika belum ada foto
- Tombol upload/ganti foto di halaman profil, hanya bisa diakses oleh pemilik profil

**Non-Goals:**
- Cloud storage (S3, Cloudinary, GDrive) — cukup lokal untuk saat ini
- Crop/resize gambar di sisi frontend
- Moderasi atau validasi konten gambar
- Foto profil untuk semua anggota di halaman Anggota (hanya halaman profil sendiri)

## Decisions

### 1. Penyimpanan file: Lokal vs Cloud

**Pilihan**: Lokal (`hmti-backend/uploads/avatars/`)

**Alasan**: Proyek ini menggunakan SQLite lokal dan tidak ada konfigurasi cloud saat ini. Menambahkan S3/Cloudinary akan menambah kompleksitas yang tidak perlu untuk skala komunitas mahasiswa. File lokal cukup dan konsisten dengan pendekatan saat ini.

**Alternatif diabaikan**: Menyimpan base64 di database — boros storage DB dan memperlambat query.

### 2. Format nama file: UUID vs NIA+timestamp

**Pilihan**: `<nia>-<timestamp>.<ext>` — misalnya `2021001-1719320000000.jpg`

**Alasan**: Mudah di-debug (langsung tahu file milik siapa), tetap unik karena ada timestamp, dan memudahkan cleanup jika anggota dihapus.

### 3. Endpoint: dedicated avatar vs update profile umum

**Pilihan**: Endpoint terpisah `PATCH /members/me/avatar` dengan `@UseInterceptors(FileInterceptor)`

**Alasan**: Endpoint `PATCH /members/me` menggunakan JSON body untuk data teks. Mencampur multipart + JSON menyulitkan parsing. Endpoint terpisah lebih bersih dan sesuai REST convention.

### 4. Serving file statis

**Pilihan**: `ServeStaticModule` dari `@nestjs/serve-static` di `app.module.ts`, serving folder `uploads/` di path `/uploads`

**Alasan**: Built-in NestJS, tidak perlu konfigurasi Nginx/proxy tambahan untuk development.

### 5. Fallback avatar di frontend

**Pilihan**: Tampilkan inisial nama dalam lingkaran berwarna jika `avatarUrl` kosong/null

**Alasan**: UX lebih baik dari placeholder kosong; konsisten dengan banyak aplikasi modern.

## Risks / Trade-offs

- **[Risk] File tidak terhapus saat anggota dihapus** → Mitigation: tambah logika hapus file di `MembersService.remove()` saat implementasi
- **[Risk] File foto bisa diakses publik tanpa autentikasi** → Mitigation: acceptable untuk foto profil (bukan data sensitif); URL tidak mudah ditebak karena ada timestamp
- **[Risk] Storage penuh jika file lama tidak dihapus** → Mitigation: saat upload avatar baru, hapus file lama berdasarkan `avatarUrl` sebelumnya
- **[Risk] Tipe file tidak divalidasi** → Mitigation: gunakan `fileFilter` di Multer config untuk hanya menerima `image/jpeg`, `image/png`, `image/webp`; batasi ukuran 2MB

## Migration Plan

1. Jalankan migrasi Prisma: `npx prisma migrate dev --name add-avatar-url`
2. Buat folder `hmti-backend/uploads/avatars/` (dibuat otomatis oleh Multer saat pertama upload)
3. Deploy backend — field `avatarUrl` nullable, tidak ada breaking change
4. Deploy frontend — menampilkan fallback inisial jika `avatarUrl` null

**Rollback**: Hapus kolom `avatarUrl` via migrasi Prisma; revert perubahan frontend. Tidak ada data kritis yang hilang.

## Open Questions

- Apakah foto profil anggota perlu ditampilkan di halaman daftar Anggota juga, atau cukup di halaman profil sendiri?
- Batas ukuran file: 2MB cukup atau perlu lebih besar?
