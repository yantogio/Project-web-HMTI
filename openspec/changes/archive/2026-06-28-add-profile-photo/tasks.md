## 1. Database & Migrasi Prisma

- [x] 1.1 Tambah field `avatarUrl String?` pada model `Member` di `hmti-backend/prisma/schema.prisma`
- [x] 1.2 Jalankan `npx prisma migrate dev --name add-avatar-url` untuk membuat migrasi database
- [x] 1.3 Jalankan `npx prisma generate` untuk memperbarui Prisma Client

## 2. Backend: Konfigurasi Upload File

- [x] 2.1 Install dependency `@nestjs/serve-static` dan `multer` (cek apakah sudah ada, jika belum jalankan `npm install @nestjs/serve-static multer`)
- [x] 2.2 Buat folder `hmti-backend/uploads/avatars/` (atau pastikan dibuat otomatis oleh Multer)
- [x] 2.3 Tambah `ServeStaticModule` di `app.module.ts` untuk serving folder `uploads/` di path `/uploads`
- [x] 2.4 Konfigurasi `MulterModule` di `members.module.ts` dengan `fileFilter` (hanya JPEG/PNG/WebP) dan batas ukuran 2MB

## 3. Backend: Endpoint Upload Avatar

- [x] 3.1 Tambah method `updateAvatar(nia: string, file: Express.Multer.File)` di `MembersService` — simpan file, hapus file lama jika ada, update `avatarUrl` di database
- [x] 3.2 Tambah endpoint `PATCH /members/me/avatar` di `MembersController` dengan `@UseGuards(JwtAuthGuard)`, `@UseInterceptors(FileInterceptor('avatar'))`, dan `@UploadedFile()` decorator
- [x] 3.3 Pastikan endpoint mengembalikan `{ avatarUrl: "<url-publik>" }` setelah upload berhasil
- [x] 3.4 Tambah logika hapus file lama di `updateAvatar` menggunakan `fs.unlink` jika `avatarUrl` sebelumnya tidak null

## 4. Backend: Include avatarUrl di Response Profil

- [x] 4.1 Pastikan `findOne` di `MembersService` menyertakan field `avatarUrl` dalam response data profil (kemungkinan sudah otomatis karena Prisma select semua field by default)

## 5. Frontend: Komponen Avatar di Profile.vue

- [x] 5.1 Tambah field `avatarUrl` ke state `profileData` di `Profile.vue` dan isi dari response API `GET /members/me`
- [x] 5.2 Buat komponen avatar di bagian atas halaman profil: tampilkan `<img>` jika `avatarUrl` ada, atau `<div>` inisial nama jika tidak ada
- [x] 5.3 Tambah tombol "Ganti Foto" / area klik di atas avatar yang memicu input file tersembunyi (`<input type="file" accept="image/jpeg,image/png,image/webp">`)
- [x] 5.4 Implementasi fungsi `handleAvatarUpload` yang mengirim file ke `PATCH /members/me/avatar` menggunakan `FormData` dan Axios
- [x] 5.5 Setelah upload berhasil, perbarui `profileData.avatarUrl` secara reaktif agar foto baru langsung tampil
- [x] 5.6 Tambah indikator loading saat upload sedang berlangsung (disable tombol, tampilkan spinner atau teks "Mengupload...")
- [x] 5.7 Tampilkan pesan error yang informatif jika upload gagal (tipe file salah, ukuran terlalu besar, atau error server)

## 6. Verifikasi & Testing Manual

- [ ] 6.1 Test upload foto berhasil: pilih gambar JPEG/PNG, verifikasi foto tampil di halaman profil
- [ ] 6.2 Test validasi tipe file: coba upload PDF atau GIF, verifikasi pesan error muncul
- [ ] 6.3 Test validasi ukuran: coba upload gambar > 2MB, verifikasi pesan error muncul
- [ ] 6.4 Test fallback avatar: buka profil anggota yang belum punya foto, verifikasi inisial nama tampil
- [ ] 6.5 Test ganti foto: upload foto kedua kali, verifikasi foto baru tampil dan file lama terhapus dari `uploads/avatars/`

