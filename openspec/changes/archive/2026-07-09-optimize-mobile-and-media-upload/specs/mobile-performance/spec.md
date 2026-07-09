## ADDED Requirements

### Requirement: Efek backdrop-blur di-gate pada mobile

Elemen yang menggunakan `backdrop-blur` untuk efek glass — khususnya kelas tema `cardGlass`, `nav`/header sticky, dan overlay modal — SHALL menonaktifkan `backdrop-blur` pada viewport mobile (breakpoint `< md`, lebar 767px ke bawah) dan/atau perangkat `pointer: coarse`, menggantinya dengan latar solid atau semi-transparan yang setara secara visual tanpa blur. Tampilan glass dengan `backdrop-blur` SHALL tetap dipertahankan pada desktop.

#### Scenario: Kartu tidak mem-blur latar di mobile
- **WHEN** halaman admin dirender pada viewport ≤ 767px atau perangkat pointer-coarse
- **THEN** elemen `cardGlass` dan sejenisnya ditampilkan dengan latar solid/semi-transparan tanpa `backdrop-blur`, sehingga tidak ada re-blur latar per frame saat scroll

#### Scenario: Navbar sticky tidak mem-blur saat scroll di mobile
- **WHEN** pengguna men-scroll halaman pada viewport mobile
- **THEN** header/navbar sticky tidak menerapkan `backdrop-blur`, dan scroll tetap mulus tanpa jank

#### Scenario: Tampilan glass desktop dipertahankan
- **WHEN** aplikasi dirender pada viewport desktop
- **THEN** efek `backdrop-blur` pada kartu, navbar, dan overlay tampil seperti sebelumnya

### Requirement: Optimasi mobile tidak mengubah desktop

Seluruh penyesuaian performa untuk mobile SHALL dikurung dalam batas yang tidak berlaku pada viewport desktop (mis. `@media (max-width: 767px)`), sehingga tampilan dan perilaku pada viewport ≥ 768px identik dengan sebelum perubahan. Optimasi ini SHALL bersifat presentational (CSS) dan TIDAK mengubah logika, struktur DOM, atau alur fungsi apa pun.

#### Scenario: Desktop tidak berubah
- **WHEN** aplikasi dirender pada viewport ≥ 768px
- **THEN** efek glass, animasi latar, dan seluruh gaya tampil persis seperti sebelum perubahan, di mode terang maupun gelap

#### Scenario: Fungsi tetap berjalan
- **WHEN** pengguna memakai fitur yang sudah ada (upload dokumen, tabel anggota, modal, navigasi) di mobile maupun desktop
- **THEN** semua fungsi berjalan sama seperti sebelumnya, karena optimasi hanya menyentuh properti tampilan

### Requirement: Elemen mengambang tidak memblok tap di mobile

Elemen mengambang / overlay yang selalu tampil (mis. tombol navigasi cepat / SpeedDial di kiri-bawah) SHALL TIDAK menghalangi interaksi tap pada konten di baliknya. Area kontainer yang kosong (di luar tombol yang benar-benar interaktif) SHALL bersifat pass-through (`pointer-events: none`), sehingga hanya tombol yang aktif yang menangkap tap. Ini berlaku di seluruh area layar, termasuk bagian bawah.

#### Scenario: Tombol/tab di area bawah tetap bisa ditekan
- **WHEN** pengguna menekan tombol atau tab yang berada di bagian bawah layar mobile, di area yang beririsan dengan bounding box tombol mengambang
- **THEN** tap diteruskan ke tombol/tab konten tersebut dan aksinya berjalan (tidak diserap oleh kontainer tombol mengambang)

#### Scenario: Tombol mengambang tetap berfungsi
- **WHEN** pengguna menekan tombol navigasi cepat (FAB) atau item yang sedang terbuka
- **THEN** tombol tersebut tetap menerima tap dan berfungsi normal

### Requirement: Latar aplikasi hemat repaint di mobile

Kombinasi latar global (AnimatedBackground) dan efek blur kartu SHALL tidak menghasilkan repaint kontinu pada mobile saat layar diam. Pada viewport mobile dan `prefers-reduced-motion`, tidak boleh ada animasi latar yang berjalan terus-menerus.

#### Scenario: Layar diam tidak memicu repaint terus-menerus di mobile
- **WHEN** pengguna membuka halaman di mobile dan tidak berinteraksi
- **THEN** tidak ada animasi latar (gradient/blur/blend) yang menyebabkan repaint berulang, sehingga CPU/GPU idle
