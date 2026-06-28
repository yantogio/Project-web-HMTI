## ADDED Requirements

### Requirement: Import anggota massal via file Excel
Sistem SHALL menyediakan endpoint `POST /members/import` yang menerima file Excel (`multipart/form-data`, field name `file`), mem-parsing setiap baris data, memvalidasi field wajib dan nilai yang diizinkan, membuat akun anggota baru dengan password di-hash, dan mengembalikan ringkasan hasil.

#### Scenario: Import berhasil untuk semua baris valid
- **WHEN** pengguna mengupload file Excel berisi 5 baris data valid tanpa duplikat NIA/NPM
- **THEN** sistem membuat 5 akun anggota baru dan mengembalikan `{ imported: 5, skipped: 0, errors: [] }`

#### Scenario: Baris dengan NIA duplikat dilewati, bukan error fatal
- **WHEN** file Excel berisi baris dengan NIA yang sudah ada di database
- **THEN** baris tersebut masuk ke array `errors` dengan keterangan "NIA sudah terdaftar", import baris lain tetap berjalan, dan total `imported` tidak menghitung baris tersebut

#### Scenario: Baris dengan NPM duplikat dilewati
- **WHEN** file Excel berisi baris dengan NPM yang sudah ada di database
- **THEN** baris tersebut masuk ke array `errors` dengan keterangan "NPM sudah terdaftar"

#### Scenario: Baris dengan field wajib kosong dilewati
- **WHEN** salah satu baris tidak memiliki nilai NIA, NPM, Nama, Angkatan, Jabatan, atau Role
- **THEN** baris tersebut masuk ke array `errors` dengan keterangan field mana yang kosong

#### Scenario: Nilai Role tidak valid dilewati
- **WHEN** kolom Role berisi nilai selain ketum/sekretaris/bendahara/anggota (setelah di-lowercase dan trim)
- **THEN** baris tersebut masuk ke array `errors` dengan keterangan "Nilai Role tidak valid: [nilai]"

#### Scenario: Normalisasi input otomatis
- **WHEN** kolom Role berisi "Anggota", " ANGGOTA ", atau "anggota"
- **THEN** sistem menerima semua variasi tersebut sebagai valid (trim + lowercase sebelum validasi)

#### Scenario: Password di-hash sebelum disimpan
- **WHEN** anggota berhasil diimport
- **THEN** password yang tersimpan di database adalah bcrypt hash dari "password123", bukan plaintext

#### Scenario: Status default Aktif jika kolom Status kosong
- **WHEN** kolom Status pada baris Excel kosong atau tidak diisi
- **THEN** sistem menggunakan nilai default "Aktif" untuk field status anggota tersebut

#### Scenario: File bukan Excel menghasilkan error 400
- **WHEN** pengguna mengupload file selain .xlsx atau .xls
- **THEN** sistem mengembalikan HTTP 400 dengan pesan "Format file tidak didukung. Gunakan file .xlsx"

#### Scenario: File tidak ditemukan dalam request menghasilkan error 400
- **WHEN** request dikirim tanpa field `file`
- **THEN** sistem mengembalikan HTTP 400 dengan pesan "File tidak ditemukan dalam request"
