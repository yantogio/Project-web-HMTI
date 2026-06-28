## ADDED Requirements

### Requirement: Generate template Excel untuk import anggota
Sistem SHALL menyediakan endpoint `GET /members/import-template` yang menghasilkan file Excel (.xlsx) berisi struktur kolom yang benar, baris contoh data, dan keterangan validasi per kolom agar pengguna tidak melakukan kesalahan format.

#### Scenario: Download template berhasil
- **WHEN** pengguna mengakses `GET /members/import-template`
- **THEN** sistem mengembalikan file Excel dengan Content-Disposition `attachment; filename="Template-Import-Anggota.xlsx"` dan Content-Type `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

#### Scenario: Template berisi kolom yang benar
- **WHEN** file template dibuka di aplikasi spreadsheet
- **THEN** baris header berisi kolom: NIA, NPM, Nama Lengkap, Angkatan, Jabatan, Role, Status — dalam urutan tersebut

#### Scenario: Template berisi baris contoh
- **WHEN** file template dibuka
- **THEN** terdapat minimal satu baris contoh data valid di bawah header (misalnya: NIA=2024001, NPM=123456789, Nama Lengkap=Budi Santoso, Angkatan=2024, Jabatan=Anggota Biasa, Role=anggota, Status=Aktif)

#### Scenario: Template berisi keterangan nilai yang diizinkan
- **WHEN** file template dibuka
- **THEN** terdapat baris atau kolom keterangan yang mencantumkan: nilai Role yang valid (ketum / sekretaris / bendahara / anggota), nilai Status yang valid (Aktif / Tidak Aktif), dan catatan bahwa NIA dan NPM harus unik
