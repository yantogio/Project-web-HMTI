## Why

Setiap awal tahun ajaran baru, pengurus harus menambahkan puluhan data anggota satu per satu melalui form manual — proses yang lambat, rawan typo, dan tidak efisien. Fitur import massal via Excel memungkinkan pengurus mengunggah seluruh data angkatan baru sekaligus, lengkap dengan pembuatan akun otomatis menggunakan default password yang sudah ditetapkan.

## What Changes

- Tambah endpoint `GET /members/import-template` yang mengembalikan file Excel berisi header kolom, baris contoh, dan catatan validasi untuk setiap kolom (opsi Role, opsi Status, format NIA/NPM, dll.)
- Tambah endpoint `POST /members/import` yang menerima file Excel, mem-parsing baris data, menghash password default, membuat akun anggota secara massal, dan mengembalikan ringkasan (berhasil / dilewati / error per baris)
- Tambah tombol "Import Excel" dan tombol "Download Template" di halaman Anggota (hanya terlihat oleh pengguna yang memiliki `canManageData`)
- Tambah modal konfirmasi import: menampilkan preview jumlah baris yang akan diproses sebelum dikirim
- Tambah modal hasil import: menampilkan ringkasan baris berhasil, dilewati (NIA/NPM duplikat), dan baris error beserta keterangannya

## Capabilities

### New Capabilities

- `excel-import-template`: Endpoint dan logika generate file Excel template dengan header, contoh data, dan keterangan validasi per kolom
- `bulk-member-import`: Endpoint parsing Excel, validasi per baris, hash password, create akun massal, dan return ringkasan hasil

### Modified Capabilities

- `member-management`: Halaman Anggota mendapat dua tombol baru (Import Excel & Download Template) dan dua modal baru (konfirmasi & hasil import)

## Impact

- **Backend**: Dua endpoint baru di `MembersController` dan dua method baru di `MembersService`; library `exceljs` sudah terinstall (dipakai oleh modul keuangan)
- **Frontend**: `Anggota.vue` mendapat state, fungsi, dan komponen modal baru; tidak ada perubahan pada komponen lain
- **Database**: Tidak ada perubahan schema; akun dibuat via `prisma.member.create()` yang sudah ada
- **Dependensi**: `bcrypt` sudah tersedia di backend; `exceljs` sudah tersedia di backend
