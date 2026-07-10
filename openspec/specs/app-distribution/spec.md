# app-distribution Specification

## Purpose
TBD - created by archiving change add-ehmti-apk-download. Update Purpose after archive.
## Requirements
### Requirement: Endpoint unduhan APK publik

Backend SHALL menyediakan endpoint HTTP GET publik yang mengalirkan berkas `E-hmti.apk` dari Google Drive ke klien. Endpoint ini MUST dapat diakses tanpa autentikasi JWT, karena calon anggota yang belum memiliki akun juga perlu memasang aplikasi.

Endpoint MUST mengidentifikasi berkas Drive melalui konfigurasi environment, bukan konstanta yang ditanam di kode.

#### Scenario: Unduhan berhasil

- **WHEN** klien mengirim `GET /documents/app/apk` dan berkas tersedia di Drive
- **THEN** sistem membalas `200 OK` dengan header `Content-Type: application/vnd.android.package-archive`
- **AND** header `Content-Disposition: attachment; filename="E-HMTI.apk"`
- **AND** badan respons berisi aliran byte APK yang identik dengan berkas di Drive

#### Scenario: Akses tanpa token

- **WHEN** klien anonim tanpa header `Authorization` mengakses endpoint unduhan
- **THEN** sistem tetap membalas `200 OK` dan mengalirkan berkas
- **AND** sistem TIDAK membalas `401 Unauthorized`

#### Scenario: File ID tidak dikonfigurasi

- **WHEN** variabel environment file ID APK kosong atau tidak diset
- **THEN** sistem membalas galat `503 Service Unavailable`
- **AND** sistem mencatat log peringatan yang menyebut nama variabel environment yang hilang

#### Scenario: Berkas tidak dapat diakses di Drive

- **WHEN** Google Drive membalas `403` atau `404` untuk file ID yang dikonfigurasi
- **THEN** sistem membalas galat `404 Not Found` dengan pesan berbahasa Indonesia yang ramah pengguna
- **AND** sistem TIDAK membocorkan file ID Drive, kredensial, atau jejak tumpukan (stack trace) ke dalam respons

#### Scenario: Aliran data terputus di tengah jalan

- **WHEN** aliran dari Drive mengalami galat setelah header respons terkirim
- **THEN** sistem menghancurkan (destroy) respons alih-alih mencoba mengirim header galat kedua
- **AND** sistem mencatat galat tersebut ke log

### Requirement: Tombol Download E-HMTI di halaman utama

Halaman `HomeView` SHALL menampilkan tombol berlabel `Download E-HMTI` pada bagian hero. Tombol ini MUST diposisikan di bawah baris tombol `Gabung Sekarang` dan `Hubungi Ketua Umum`, rata tengah secara horizontal, dan MUST memiliki gaya visual yang dapat dibedakan dari kedua tombol tersebut.

Tombol MUST tetap terlihat dan dapat dioperasikan pada mode terang maupun mode gelap.

#### Scenario: Tombol tampil di posisi yang benar

- **WHEN** pengguna membuka halaman utama
- **THEN** tombol `Download E-HMTI` tampil di bawah baris CTA yang ada
- **AND** tombol terpusat secara horizontal relatif terhadap kontainer hero

#### Scenario: Klik memicu unduhan

- **WHEN** pengguna mengeklik tombol `Download E-HMTI`
- **THEN** browser memulai unduhan berkas APK
- **AND** halaman utama tetap tampil serta TIDAK meninggalkan tab kosong yang baru terbuka

#### Scenario: Umpan balik saat unduhan sedang disiapkan

- **WHEN** unduhan telah dipicu
- **THEN** tombol menampilkan keadaan sedang bekerja (loading) dan dinonaktifkan sementara
- **AND** tombol kembali ke keadaan semula setelah ambang waktu singkat, sehingga pengguna dapat mencoba lagi

#### Scenario: Mode gelap

- **WHEN** situs berada dalam mode gelap
- **THEN** tombol memakai varian warna mode gelap
- **AND** rasio kontras teks terhadap latarnya memenuhi WCAG AA (minimum 4.5:1)

### Requirement: Kesetaraan perilaku desktop dan mobile

Alur unduhan SHALL berperilaku setara pada peramban desktop dan mobile. Pemicuan unduhan MUST NOT bergantung pada pembukaan jendela baru lewat skrip, karena hal itu rentan diblokir oleh pemblokir popup dan menyisakan tab kosong pada peramban mobile.

#### Scenario: Tata letak mobile

- **WHEN** halaman utama dirender pada lebar viewport di bawah `640px`
- **THEN** tombol `Download E-HMTI` tampil menumpuk vertikal di bawah CTA yang ada, dengan jarak antar tombol yang konsisten
- **AND** tombol TIDAK menyebabkan halaman menggulir secara horizontal

#### Scenario: Tanpa blokir popup

- **WHEN** pengguna mengeklik tombol unduh pada peramban mobile dengan pemblokir popup aktif
- **THEN** unduhan tetap berjalan
- **AND** tidak ada peringatan popup terblokir yang muncul

#### Scenario: Regresi tata letak hero

- **WHEN** tombol baru telah ditambahkan
- **THEN** tombol `Gabung Sekarang` dan `Hubungi Ketua Umum` mempertahankan posisi, ukuran, dan animasi masuk (fade-up) seperti sebelumnya
- **AND** indikator gulir (scroll indicator) di bawahnya tetap tampil tanpa tumpang tindih

