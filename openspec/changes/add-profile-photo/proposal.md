## Why

Halaman profil anggota saat ini hanya menampilkan data teks (nama, jabatan, email, dll) tanpa foto profil, sehingga tampilan kurang personal dan identitas anggota sulit dikenali secara visual. Fitur foto profil akan meningkatkan pengalaman pengguna dan memberikan identitas visual pada setiap anggota.

## What Changes

- Tambah field `avatarUrl` pada model `Member` di database (Prisma/SQLite) untuk menyimpan URL atau path foto profil
- Backend: endpoint baru `PATCH /members/me/avatar` untuk upload foto profil (menggunakan multipart/form-data)
- Backend: file foto disimpan secara lokal di server (folder `uploads/avatars/`) dan dikembalikan sebagai URL publik
- Frontend (Profile.vue): tambah komponen foto profil di bagian atas halaman dengan tombol upload/ganti foto
- Frontend: menampilkan avatar di header profil dan di semua tempat yang menampilkan informasi anggota

## Capabilities

### New Capabilities

- `profile-avatar`: Upload, simpan, dan tampilkan foto profil anggota — mencakup backend endpoint upload, penyimpanan file, serving file statis, dan UI komponen avatar di halaman profil

### Modified Capabilities

- (tidak ada perubahan pada spec yang sudah ada)

## Impact

- **Database**: Migrasi Prisma untuk menambah kolom `avatarUrl String?` pada model `Member`
- **Backend**: NestJS — modul members mendapat endpoint baru, konfigurasi `MulterModule` untuk file upload, serving static files via `ServeStaticModule`
- **Frontend**: `Profile.vue` dimodifikasi untuk menampilkan dan mengupload avatar; `useAuthStore` mungkin perlu menyimpan `avatarUrl`
- **Storage**: File foto disimpan lokal di `hmti-backend/uploads/avatars/` (tidak menggunakan cloud storage eksternal)
