## ADDED Requirements

### Requirement: Tombol Laporan Uang Kas

Sistem SHALL menyediakan tombol **"Laporan Uang Kas"** di halaman Keuangan, ditempatkan bersebelahan dengan tombol "Buat Tagihan Bulan Ini". Tombol ini SHALL hanya tampil/aktif untuk peran yang berwenang (bendahara), konsisten dengan pembatasan fitur laporan keuangan yang sudah ada.

#### Scenario: Bendahara melihat tombol

- **WHEN** seorang bendahara membuka halaman Keuangan
- **THEN** tombol "Laporan Uang Kas" tampil di samping tombol "Buat Tagihan Bulan Ini"

#### Scenario: Non-bendahara tidak dapat memicu laporan

- **WHEN** pengguna tanpa peran bendahara mengakses halaman Keuangan
- **THEN** tombol laporan uang kas tidak tersedia baginya, dan permintaan laporan dari peran tak berwenang ditolak oleh backend

### Requirement: Unduh laporan Excel saat tombol diklik

Sistem SHALL, saat tombol "Laporan Uang Kas" diklik, menghasilkan dan mengunduh sebuah file Excel (.xlsx) berisi rekap status pembayaran uang kas. Berkas SHALL diberi nama yang menjelaskan isinya (mis. rentang periode yang tercakup).

#### Scenario: Klik menghasilkan unduhan

- **WHEN** bendahara mengklik tombol "Laporan Uang Kas"
- **THEN** sistem menghasilkan file Excel dan memicu unduhan di peramban pengguna

#### Scenario: Umpan balik saat proses

- **WHEN** proses pembuatan laporan sedang berjalan
- **THEN** sistem menampilkan indikator sedang memuat dan mencegah klik ganda hingga selesai

### Requirement: Cakupan laporan seluruh anggota aktif dari periode awal hingga bulan berjalan

Laporan SHALL mencakup SELURUH anggota berstatus `Aktif`. Rentang periode SHALL dimulai dari periode tagihan paling awal yang tercatat di sistem hingga bulan pada saat tombol diklik (bulan berjalan). Setiap anggota aktif SHALL muncul sebagai baris, dan setiap periode bulan dalam rentang SHALL muncul sebagai kolom/segmen status.

#### Scenario: Rentang periode

- **WHEN** laporan dibuat
- **THEN** kolom periode membentang dari periode `Dues` paling awal hingga periode bulan saat laporan diminta

#### Scenario: Seluruh anggota aktif tercakup

- **WHEN** laporan dibuat
- **THEN** setiap anggota aktif memiliki baris, termasuk anggota yang belum memiliki tagihan apa pun

### Requirement: Status pembayaran per periode dalam laporan

Untuk setiap kombinasi anggota dan periode, laporan SHALL menyatakan status pembayaran uang kas — antara lain nominal yang dibayar, kondisi belum bayar, terkena denda keterlambatan, dan lebih bayar (kredit) — mengikuti format laporan uang kas pada umumnya. Laporan SHALL menyajikan pula ringkasan total per anggota (mis. total tunggakan atau total dibayar).

#### Scenario: Bulan sudah dibayar

- **WHEN** seorang anggota telah membayar uang kas untuk suatu periode
- **THEN** sel periode tersebut menampilkan nominal yang dibayar (atau penanda lunas)

#### Scenario: Bulan belum dibayar

- **WHEN** seorang anggota belum membayar uang kas untuk suatu periode
- **THEN** sel periode tersebut menandai kondisi belum bayar

#### Scenario: Bulan terkena denda

- **WHEN** sebuah tagihan periode telah dikenakan denda keterlambatan (`lateFeeApplied`)
- **THEN** sel/laporan menandai bahwa periode tersebut terkena denda beserta pengaruhnya pada nominal tagihan

#### Scenario: Lebih bayar

- **WHEN** seorang anggota memiliki kelebihan bayar untuk suatu periode
- **THEN** laporan menandai kondisi lebih bayar (kredit) pada periode tersebut

#### Scenario: Ringkasan per anggota

- **WHEN** laporan dibuat
- **THEN** setiap baris anggota menyertakan kolom ringkasan (mis. total dibayar dan/atau total sisa tunggakan)
