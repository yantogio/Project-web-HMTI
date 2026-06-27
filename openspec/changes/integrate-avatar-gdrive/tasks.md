## 1. Database & Migrasi Prisma

- [x] 1.1 Tambah field `avatarDriveFileId String?` pada model `Member` di `hmti-backend/prisma/schema.prisma`
- [x] 1.2 Jalankan `npx prisma migrate dev --name add_avatar_drive_file_id` di folder `hmti-backend`
- [x] 1.3 Jalankan `npx prisma generate` untuk memperbarui Prisma Client

## 2. Backend: Konfigurasi Upload ke Google Drive

- [x] 2.1 Tambah `FOLDER_ID_AVATARS=<id>` ke `hmti-backend/.env` (folder "Foto Profil Anggota" di Google Drive WEB HMTI)
- [x] 2.2 Ganti `diskStorage` ke `memoryStorage` di `MulterModule` pada `hmti-backend/src/members/members.module.ts`, hapus import `mkdirSync`, `diskStorage`, dan `extname` yang tidak lagi dipakai
- [x] 2.3 Tambah `GoogleDriveService` sebagai provider di `hmti-backend/src/members/members.module.ts`

## 3. Backend: Update Service updateAvatar

- [x] 3.1 Inject `GoogleDriveService` ke constructor `MembersService` di `hmti-backend/src/members/members.service.ts`
- [x] 3.2 Update method `updateAvatar`: jika `avatarDriveFileId` ada, panggil `googleDriveService.deleteFile(avatarDriveFileId)` sebelum upload baru (gunakan `.catch(() => {})`)
- [x] 3.3 Panggil `googleDriveService.uploadFile(file, process.env.FOLDER_ID_AVATARS)` untuk upload ke Drive
- [x] 3.4 Construct `avatarUrl` sebagai `https://drive.google.com/thumbnail?id=${fileId}&sz=w400` dari Drive file ID
- [x] 3.5 Update database dengan `avatarUrl` baru dan `avatarDriveFileId` dari response Drive
- [x] 3.6 Hapus import `unlink` dari `fs/promises` dan `join` dari `path` di `members.service.ts` jika tidak lagi dipakai

## 4. Frontend: Halaman Anggota

- [x] 4.1 Di `hmti-frontend/src/views/Anggota.vue`, ganti `member.official_photo_url` → `member.avatarUrl` pada template kolom foto di tabel (baris `<img :src="member.official_photo_url || ...">`)
- [x] 4.2 Ganti `selectedMemberProfile.official_photo_url` → `selectedMemberProfile.avatarUrl` pada template modal detail anggota

## 5. Frontend: Halaman HomeView

- [x] 5.1 Di `hmti-frontend/src/views/HomeView.vue`, update fungsi `fetchOfficers` pada bagian mapping data: ubah agar `img` mengambil `member.avatarUrl` jika tersedia, fallback ke URL `ui-avatars.com` jika null

## 6. Verifikasi & Testing Manual

- [ ] 6.1 Upload foto profil baru di halaman Profil — verifikasi foto tersimpan di Google Drive folder FOLDER_ID_AVATARS dan tampil di halaman Profil
- [ ] 6.2 Buka halaman Anggota — verifikasi foto profil anggota yang sudah upload tampil di tabel dan modal
- [ ] 6.3 Buka halaman HomeView — verifikasi foto pengurus tampil di carousel jika `avatarUrl` tersedia
- [ ] 6.4 Ganti foto profil — verifikasi file lama terhapus dari Google Drive dan foto baru tampil
- [ ] 6.5 Buka profil anggota yang belum punya foto — verifikasi fallback inisial/ui-avatars tampil di Anggota dan HomeView
