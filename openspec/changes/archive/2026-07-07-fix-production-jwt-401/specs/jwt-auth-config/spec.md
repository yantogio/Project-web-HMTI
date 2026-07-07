# Spec: jwt-auth-config

## ADDED Requirements

### Requirement: Kunci JWT tunggal dari environment
Sistem SHALL menggunakan satu kunci rahasia yang dibaca dari environment variable `JWT_SECRET` untuk menandatangani (sign) dan memverifikasi (verify) token JWT. Tidak boleh ada kunci JWT hardcoded di kode sumber.

#### Scenario: Token hasil login diterima endpoint ber-guard
- **WHEN** user login dan menerima `access_token`, lalu memanggil endpoint yang dilindungi `JwtAuthGuard` (mis. `GET /api/members/me`) dengan header `Authorization: Bearer <access_token>`
- **THEN** sistem memverifikasi token dengan kunci yang sama dengan yang dipakai saat sign dan merespons 200 dengan data user

#### Scenario: Token dengan signature dari kunci lain ditolak
- **WHEN** request membawa token yang ditandatangani dengan kunci selain `JWT_SECRET` yang aktif
- **THEN** sistem merespons 401 Unauthorized

### Requirement: Validasi startup untuk JWT_SECRET
Aplikasi backend SHALL gagal start dengan pesan error yang jelas apabila environment variable `JWT_SECRET` tidak diset atau kosong. Aplikasi MUST NOT diam-diam memakai kunci default/fallback.

#### Scenario: JWT_SECRET tidak diset
- **WHEN** aplikasi dijalankan tanpa `JWT_SECRET` di environment
- **THEN** aplikasi berhenti saat startup dengan pesan error yang menyebutkan `JWT_SECRET` belum dikonfigurasi

#### Scenario: JWT_SECRET diset
- **WHEN** aplikasi dijalankan dengan `JWT_SECRET` berisi nilai non-kosong
- **THEN** aplikasi start normal dan seluruh alur autentikasi memakai nilai tersebut
