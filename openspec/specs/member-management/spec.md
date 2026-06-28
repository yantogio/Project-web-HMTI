# Capability: Member Management

## Purpose

Mengelola tampilan, interaksi, dan aksi pada halaman Anggota, termasuk kontrol akses berbasis role untuk fitur-fitur manajemen data.

## Requirements

### Requirement: Tombol Download Template di halaman Anggota
Halaman Anggota SHALL menampilkan tombol "Download Template" yang hanya terlihat oleh pengguna dengan `canManageData === true`, yang ketika diklik men-trigger download file template Excel dari endpoint `GET /members/import-template`.

#### Scenario: Tombol terlihat oleh pengurus
- **WHEN** pengguna login sebagai ketum, sekretaris, atau bendahara dan membuka halaman Anggota
- **THEN** tombol "Download Template" terlihat di area aksi cepat (berdekatan dengan tombol Import Excel)

#### Scenario: Tombol tidak terlihat oleh anggota biasa
- **WHEN** pengguna login sebagai role anggota
- **THEN** tombol "Download Template" tidak ditampilkan

#### Scenario: Klik Download Template memulai download
- **WHEN** pengguna mengklik tombol "Download Template"
- **THEN** browser mendownload file "Template-Import-Anggota.xlsx" secara otomatis

### Requirement: Tombol Import Excel dan modal import di halaman Anggota
Halaman Anggota SHALL menampilkan tombol "Import Excel" yang ketika diklik membuka modal dua langkah: (1) pilih file + pratinjau jumlah baris, (2) hasil import setelah proses selesai.

#### Scenario: Tombol Import Excel hanya untuk yang bisa manage data
- **WHEN** pengguna dengan `canManageData === true` membuka halaman Anggota
- **THEN** tombol "Import Excel" terlihat di area aksi cepat

#### Scenario: Modal langkah 1 — pilih file dan pratinjau
- **WHEN** pengguna mengklik "Import Excel"
- **THEN** modal terbuka dengan input file, tombol "Proses Import", dan tombol "Batal"; setelah file dipilih, modal menampilkan nama file yang dipilih

#### Scenario: Modal langkah 2 — hasil import ditampilkan
- **WHEN** proses import selesai (API mengembalikan respons)
- **THEN** modal menampilkan: jumlah anggota berhasil ditambahkan, jumlah dilewati, dan daftar baris error beserta keterangannya

#### Scenario: Setelah import berhasil, daftar anggota di-refresh
- **WHEN** import selesai dan ada minimal 1 anggota yang berhasil diimport
- **THEN** `fetchMembers()` dipanggil otomatis sehingga tabel anggota menampilkan data terbaru
