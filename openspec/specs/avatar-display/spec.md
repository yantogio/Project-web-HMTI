# Spec: Avatar Display

## Purpose

Defines requirements for displaying member avatar/profile photos across views — the Members page (table and detail modal) and the HomeView Pengurus Inti carousel — sourced from `avatarUrl` returned by the API, with fallback to initials from `ui-avatars.com`.

## Requirements

### Requirement: Tampilan avatar anggota di halaman Anggota
Halaman Anggota SHALL menampilkan foto profil dari field `avatarUrl` (dikembalikan oleh `GET /members`) pada kolom foto di tabel dan di modal detail anggota. Jika `avatarUrl` null atau kosong, SHALL menampilkan fallback berupa gambar inisial dari `ui-avatars.com`.

#### Scenario: Anggota dengan foto profil ditampilkan di tabel
- **WHEN** halaman Anggota memuat daftar anggota dan anggota memiliki `avatarUrl` tidak null
- **THEN** kolom foto menampilkan `<img>` dengan src dari `avatarUrl`

#### Scenario: Anggota tanpa foto menggunakan fallback inisial di tabel
- **WHEN** halaman Anggota memuat daftar anggota dan `avatarUrl` anggota adalah null
- **THEN** kolom foto menampilkan gambar inisial dari `ui-avatars.com`

#### Scenario: Foto tampil di modal detail anggota
- **WHEN** admin mengklik baris anggota untuk membuka modal detail
- **THEN** modal menampilkan foto dari `avatarUrl` jika ada, atau inisial jika tidak ada

### Requirement: Tampilan avatar pengurus di HomeView carousel
Halaman HomeView SHALL menampilkan foto profil pengurus dari field `avatarUrl` (dikembalikan oleh `GET /members`) di carousel Pengurus Inti. Jika `avatarUrl` null, SHALL menampilkan fallback berupa inisial dari `ui-avatars.com`.

#### Scenario: Pengurus dengan foto ditampilkan di carousel
- **WHEN** HomeView memuat data anggota dan anggota memiliki `avatarUrl` tidak null
- **THEN** slide carousel menampilkan foto dari `avatarUrl`

#### Scenario: Pengurus tanpa foto menggunakan fallback di carousel
- **WHEN** `avatarUrl` anggota adalah null
- **THEN** slide carousel menampilkan gambar inisial dari `ui-avatars.com`
