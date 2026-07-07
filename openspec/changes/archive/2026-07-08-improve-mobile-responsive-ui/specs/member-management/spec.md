## ADDED Requirements

### Requirement: Modal tambah/edit anggota berada di lapisan paling atas

Modal tambah anggota dan edit anggota SHALL dirender pada lapisan (z-index) paling atas, di atas banner notifikasi tagihan bulanan dan elemen lainnya.

#### Scenario: Modal terbuka saat banner notifikasi tampil

- **WHEN** banner notifikasi tagihan bulanan sedang tampil dan pengguna membuka modal tambah atau edit anggota
- **THEN** modal beserta overlay-nya tampil sepenuhnya di atas banner, tidak ada bagian modal yang tertimpa banner

### Requirement: Modal tambah/edit anggota responsif dan dapat ditutup di mobile

Modal tambah/edit anggota SHALL dapat di-scroll penuh hingga tombol submit terjangkau di mobile, dan SHALL menyediakan cara yang jelas untuk menutupnya di mobile.

#### Scenario: Modal lebih tinggi dari layar mobile

- **WHEN** pengguna membuka modal tambah/edit anggota pada layar mobile dan isi form lebih tinggi dari viewport
- **THEN** pengguna dapat men-scroll isi modal hingga bawah dan menekan tombol submit

#### Scenario: Menutup modal anggota di mobile

- **WHEN** modal tambah/edit anggota terbuka di mobile
- **THEN** tersedia kontrol yang jelas untuk menutup modal (mis. tombol tutup dan/atau tap area luar) tanpa harus menyelesaikan form

### Requirement: Tabel anggota responsif di mobile

Tabel anggota SHALL menyesuaikan tampilannya untuk pengguna mobile sehingga data dan aksi tetap dapat diakses tanpa kehilangan informasi penting.

#### Scenario: Tabel anggota pada layar sempit

- **WHEN** tabel anggota ditampilkan pada viewport mobile
- **THEN** data anggota dan aksi baris tetap dapat diakses dan disesuaikan (melalui penyesuaian kolom, layout kartu, atau scroll horizontal yang jelas)
