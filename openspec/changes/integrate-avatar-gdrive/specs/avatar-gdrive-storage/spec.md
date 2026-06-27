## ADDED Requirements

### Requirement: Upload avatar ke Google Drive
Sistem SHALL mengupload foto profil anggota ke folder Google Drive "Foto Profil Anggota" menggunakan `GoogleDriveService` yang sudah ada, menyimpan URL publik Drive di field `avatarUrl` dan file ID di field `avatarDriveFileId` pada model `Member`.

#### Scenario: Upload berhasil disimpan ke Drive
- **WHEN** anggota mengirim `PATCH /members/me/avatar` dengan file gambar valid (JPEG/PNG/WebP, ≤2MB)
- **THEN** file tersimpan di Google Drive folder FOLDER_ID_AVATARS, `avatarUrl` diupdate ke URL thumbnail Drive, `avatarDriveFileId` disimpan, dan response mengembalikan `{ avatarUrl: "<url>" }`

#### Scenario: File lama dihapus dari Drive saat ganti foto
- **WHEN** anggota yang sudah punya `avatarDriveFileId` mengupload foto baru
- **THEN** file lama dihapus dari Google Drive via Drive API sebelum file baru disimpan

#### Scenario: Kegagalan hapus file lama tidak membatalkan upload baru
- **WHEN** penghapusan file lama di Drive gagal (file sudah tidak ada, atau error jaringan)
- **THEN** upload file baru tetap dilanjutkan dan berhasil (error hapus diabaikan)

### Requirement: Multer menggunakan memoryStorage untuk avatar
Backend SHALL menggunakan `memoryStorage` pada `MulterModule` di `MembersModule`, sehingga file avatar tersedia sebagai `file.buffer` untuk dikirim ke Google Drive.

#### Scenario: File tidak disimpan ke disk lokal
- **WHEN** anggota mengupload foto profil
- **THEN** tidak ada file yang tersimpan di direktori `uploads/avatars/` server

### Requirement: Env variable FOLDER_ID_AVATARS tersedia
Sistem SHALL membaca `FOLDER_ID_AVATARS` dari environment variable sebagai target folder Google Drive untuk foto profil.

#### Scenario: Upload diarahkan ke folder yang benar
- **WHEN** upload avatar berhasil
- **THEN** file tersimpan di Google Drive folder dengan ID `FOLDER_ID_AVATARS`
