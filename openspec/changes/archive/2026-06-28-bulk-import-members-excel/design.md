## Context

Halaman Anggota (`Anggota.vue`) sudah memiliki form tambah anggota satu per satu dengan field: `nia`, `npm`, `name`, `angkatan`, `jabatan`, `role`, `status`. Data ini disimpan ke model `Member` di Prisma (SQLite). Password default sudah ditetapkan di schema sebagai `"password123"`. Library `exceljs` sudah terinstall di backend (dipakai modul keuangan). Library `bcrypt` sudah tersedia untuk hashing password.

Field `role` hanya boleh salah satu dari: `ketum`, `sekretaris`, `bendahara`, `anggota`. Field `status` hanya boleh `Aktif` atau `Tidak Aktif`. Kegagalan import per baris (NIA duplikat, field wajib kosong, nilai role tidak valid) tidak boleh menghentikan import baris lainnya.

## Goals / Non-Goals

**Goals:**
- Generate template Excel yang bisa didownload dengan header, baris contoh, dropdown validasi (via catatan kolom), dan petunjuk nilai yang diizinkan
- Endpoint import yang mem-parsing file Excel, memvalidasi setiap baris secara individual, membuat akun anggota massal dengan password di-hash, dan mengembalikan ringkasan detail (berhasil / dilewati / error)
- Frontend: tombol Download Template dan Import Excel hanya untuk role yang bisa manage data; modal pratinjau sebelum submit; modal hasil setelah import
- Normalisasi input secara otomatis: trim whitespace, lowercase role sebelum validasi — sehingga "Anggota", " anggota ", "ANGGOTA" semua diterima

**Non-Goals:**
- Update/overwrite data anggota yang sudah ada via import (hanya insert baru; baris duplikat dilewati)
- Import foto profil / avatar via Excel
- Validasi format NPM atau NIA secara regex (cukup cek tidak kosong)
- Notifikasi email ke anggota baru setelah import

## Decisions

### D1: Library parsing Excel — exceljs (bukan xlsx/sheetjs)
`exceljs` sudah terinstall dan dipakai di `TransactionsService`. Menggunakan library yang sama menghindari dependensi baru dan memastikan konsistensi.

### D2: Template dihasilkan server-side, bukan file statis
Template dibuat dinamis via `GET /members/import-template` sehingga bisa selalu sinkron dengan field yang dibutuhkan. Tidak perlu menyimpan file statis di repo.

Template berisi:
- Baris 1: Judul "Template Import Anggota HMTI"
- Baris 3: Header kolom (NIA, NPM, Nama Lengkap, Angkatan, Jabatan, Role, Status)
- Baris 4: Baris contoh data
- Baris 5–9: Keterangan per kolom dalam cell di bawah header (warna berbeda)
- Kolom keterangan tambahan (kolom H) berisi daftar nilai yang diizinkan

### D3: Validasi per baris, tidak abort-on-error
Setiap baris diproses independen. Baris yang gagal (duplikat NIA/NPM, field kosong, role tidak valid) dikumpulkan di array `errors`, bukan menghentikan proses. Hasilnya: `{ imported: N, skipped: N, errors: [{ row, reason }] }`.

### D4: Password selalu di-hash dengan bcrypt (bukan plaintext)
Meskipun schema memiliki default `"password123"` sebagai plaintext, import akan selalu menggunakan `bcrypt.hash("password123", 10)` sebelum menyimpan, konsisten dengan cara `changePassword()` bekerja.

### D5: Endpoint import tidak di-guard oleh JWT khusus — gunakan guard yang sama dengan POST /members
`POST /members` saat ini tidak ada guard JWT (siapapun bisa tambah anggota). Untuk konsistensi, `POST /members/import` juga tidak menambahkan guard baru. Jika security perlu diperketat di kemudian hari, itu dilakukan untuk keduanya sekaligus.

### D6: Frontend — modal dua langkah (pratinjau → hasil)
Sebelum upload, user melihat nama file dan jumlah baris yang terdeteksi. Setelah upload, user melihat ringkasan: N anggota berhasil ditambahkan, N dilewati (duplikat), daftar baris error. Ini mencegah import tidak sengaja dan memberikan feedback yang jelas.

## Risks / Trade-offs

- **File Excel berisi ratusan baris** → Semua baris di-parse secara sinkron di memory. Untuk skala HMTI (puluhan anggota per angkatan), ini tidak masalah. Jika suatu saat ada ribuan baris, bisa refactor ke streaming.
- **NIA/NPM duplikat dalam satu file (bukan hanya duplikat dengan DB)** → Prisma akan melempar error `unique constraint` pada baris kedua. Error ini ditangkap per-baris dan masuk ke array `errors` dengan keterangan yang jelas.
- **Format Excel tidak sesuai (user upload file lain / kolom diubah urutan)** → Header kolom dicek berdasarkan nama, bukan posisi. Jika header tidak ditemukan, endpoint mengembalikan error 400 dengan pesan yang jelas.

## Migration Plan

Tidak ada perubahan schema database. Deploy cukup dengan restart backend setelah menambahkan dua method baru di service dan dua endpoint baru di controller. Rollback: hapus dua endpoint dan dua method. Tidak ada state persisten yang perlu di-rollback.

## Open Questions

- Apakah perlu fitur "preview baris sebelum import" (tampilkan isi Excel di tabel di frontend sebelum konfirmasi)? → Untuk sekarang: tidak; cukup tampilkan jumlah baris terdeteksi. Preview lengkap bisa ditambah di iterasi berikutnya.
