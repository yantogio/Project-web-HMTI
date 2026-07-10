# site-branding Specification

## Purpose
TBD - created by archiving change add-ehmti-apk-download. Update Purpose after archive.
## Requirements
### Requirement: Judul dokumen situs

Dokumen HTML akar frontend SHALL memakai `HMTI UBS` sebagai judul dokumen. Judul bawaan scaffold Vite (`Vite App`) MUST NOT muncul di berkas mana pun yang dikirim ke pengguna.

#### Scenario: Judul tab browser

- **WHEN** pengguna membuka situs pada peramban mana pun
- **THEN** tab peramban menampilkan `HMTI UBS`

#### Scenario: Bundel produksi

- **WHEN** frontend dibangun untuk produksi dan `dist/index.html` diperiksa
- **THEN** berkas tersebut memuat `<title>HMTI UBS</title>`
- **AND** berkas tersebut TIDAK memuat teks `Vite App`

#### Scenario: Bookmark dan berbagi tautan

- **WHEN** pengguna menandai (bookmark) halaman atau membagikan tautannya
- **THEN** nama bawaan yang diusulkan adalah `HMTI UBS`, bukan `Vite App`

