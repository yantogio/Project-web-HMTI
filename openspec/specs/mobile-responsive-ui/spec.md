# Spec: Mobile Responsive UI

## Purpose

Defines cross-cutting requirements for a consistent, usable experience on mobile viewports across the admin application, including header layout, back button, modal, and table patterns.

## Requirements

### Requirement: Header layout tidak tumpang tindih di mobile

Header aplikasi (AdminPageLayout) SHALL menata semua elemennya — logo/subtitle, tombol kembali, tombol ganti tema, identitas user, dan tombol keluar — tanpa saling menimpa pada viewport mobile (lebar minimum 320px).

#### Scenario: Header pada layar sempit

- **WHEN** pengguna membuka halaman admin mana pun pada viewport selebar 320–430px
- **THEN** seluruh elemen header tetap terlihat penuh, tidak ada teks/ikon yang terpotong atau tertimpa elemen lain, dan tinggi header konsisten

#### Scenario: Identitas user pada mobile

- **WHEN** viewport lebih sempit dari breakpoint `md`
- **THEN** blok nama & role user menyesuaikan (disembunyikan atau diringkas) sehingga tidak mendorong tombol keluar keluar layar

### Requirement: Tombol kembali dengan desain yang mudah dikenali

Tombol kembali di samping logo HMTI SHALL menggunakan desain tombol "kembali" yang mudah dikenali pengguna (mis. ikon panah kiri yang jelas dengan/atas label), dan SHALL tetap selaras dengan tema pada mode terang, mode gelap, desktop, maupun mobile.

#### Scenario: Tampilan tombol kembali lintas tema

- **WHEN** pengguna melihat header pada mode terang maupun gelap
- **THEN** tombol kembali tampil dengan kontras yang cukup, bentuk yang jelas terbaca sebagai aksi "kembali", dan warnanya konsisten dengan aksen tema

#### Scenario: Aksi tombol kembali

- **WHEN** pengguna menekan tombol kembali
- **THEN** aplikasi kembali ke menu admin seperti perilaku sebelumnya

### Requirement: Pola modal responsif di mobile

Modal/overlay pada aplikasi SHALL dapat di-scroll penuh hingga aksi terakhir (mis. tombol submit) terjangkau, dan SHALL menyediakan cara jelas untuk menutup modal pada mode mobile.

#### Scenario: Modal lebih tinggi dari layar mobile

- **WHEN** konten modal lebih tinggi daripada tinggi viewport mobile
- **THEN** pengguna dapat men-scroll isi modal sampai bawah dan menekan tombol submit/aksi utama

#### Scenario: Menutup modal di mobile

- **WHEN** modal terbuka di mode mobile
- **THEN** tersedia kontrol yang jelas untuk menutup modal (mis. tombol tutup dan/atau tap area luar) tanpa perlu menyelesaikan form

### Requirement: Tabel adaptif untuk pengguna mobile

Tabel data SHALL adaptif di mobile sehingga pengguna dapat mengakses data dan aksi baris yang relevan tanpa kehilangan informasi penting.

#### Scenario: Tabel pada layar sempit

- **WHEN** sebuah tabel data ditampilkan pada viewport mobile
- **THEN** data dan aksi baris tetap dapat diakses (melalui penyesuaian kolom, layout kartu, atau scroll horizontal yang jelas), tidak ada aksi yang hilang sepenuhnya

### Requirement: Admin row action controls stay clickable and unobscured

Row action controls (view/edit/delete in the member table) SHALL remain fully clickable at every viewport size and SHALL NOT be overlapped by floating navigation or other fixed-position overlays. Floating navigation (the speed-dial button) SHALL be positioned or layered so it never intercepts pointer events targeting table action buttons, including when the browser window is resized to a short or narrow size. Row hover effects SHALL NOT apply transforms to `<tr>` elements in a way that displaces the clickable hit area of the action buttons.

#### Scenario: Action buttons clickable on resize
- **WHEN** the member table is displayed and the browser window is resized to a short or narrow size
- **THEN** every row's action buttons remain clickable and are not covered by the floating navigation button

#### Scenario: Floating nav does not intercept action clicks
- **WHEN** a user clicks an action button in a table row that visually overlaps the floating navigation area
- **THEN** the action button receives the click, not the floating navigation

#### Scenario: Row hover does not break hit targets
- **WHEN** a user hovers a member row and then clicks its edit or delete button
- **THEN** the click registers on the intended button without offset from a row transform
