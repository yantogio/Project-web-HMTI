## ADDED Requirements

### Requirement: Card daftar bukti transaksi di halaman keuangan
Halaman keuangan SHALL menampilkan card baru **"Bukti Transaksi"** yang dapat diakses oleh semua anggota yang sudah login. Card ini menampilkan daftar transaksi yang memiliki bukti (field `proofUrl` tidak null) dalam format list sederhana tanpa preview gambar.

#### Scenario: Semua anggota dapat melihat card bukti transaksi
- **WHEN** anggota dengan role apa pun (bukan hanya bendahara) membuka halaman keuangan
- **THEN** card Bukti Transaksi ditampilkan

#### Scenario: Card menampilkan list bukti transaksi yang tersedia
- **WHEN** terdapat beberapa transaksi dengan `proofUrl` tidak null
- **THEN** setiap bukti ditampilkan sebagai satu baris dengan nama yang terdiri dari `{kategori} — {deskripsi}`

#### Scenario: Card kosong ketika belum ada bukti
- **WHEN** belum ada transaksi dengan bukti yang diupload
- **THEN** card menampilkan pesan kosong seperti "Belum ada bukti transaksi yang diupload"

### Requirement: Nama item bukti transaksi dibentuk dari kategori dan deskripsi
Setiap item dalam daftar bukti transaksi SHALL menampilkan nama yang terbentuk dari format `{kategori} — {deskripsi transaksi}`, bukan nama file asli. Tanggal transaksi juga SHALL ditampilkan sebagai informasi sekunder.

#### Scenario: Nama item terbentuk dengan benar
- **WHEN** transaksi memiliki `category = "Kas Anggota"` dan `description = "Iuran Mei [Non-Cash]"`
- **THEN** item di daftar menampilkan nama "Kas Anggota — Iuran Mei [Non-Cash]"

### Requirement: Klik item bukti transaksi membuka file di Google Drive
Setiap item dalam daftar bukti transaksi SHALL memiliki link yang ketika diklik akan membuka URL Google Drive (`proofUrl`) di tab baru browser.

#### Scenario: Klik item membuka Drive di tab baru
- **WHEN** anggota mengklik salah satu item bukti transaksi
- **THEN** browser membuka `proofUrl` (Google Drive link) di tab baru (`target="_blank"`)

#### Scenario: Link aman dari XSS
- **WHEN** `proofUrl` ditampilkan sebagai href
- **THEN** URL di-sanitasi dan hanya URL dengan protokol `https://` yang dirender sebagai link aktif
