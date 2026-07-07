## ADDED Requirements

### Requirement: Seluruh baris bukti transaksi dapat di-tap

Pada daftar bukti transaksi di halaman keuangan, keseluruhan area baris entri SHALL berfungsi sebagai target tap untuk membuka bukti, bukan hanya area ikon.

#### Scenario: Membuka bukti dari mana saja di baris

- **WHEN** pengguna men-tap bagian mana pun dari sebuah baris bukti transaksi (ikon, teks, atau ruang kosong baris)
- **THEN** bukti transaksi terbuka (di Google Drive) sama seperti men-tap ikonnya

#### Scenario: Target tap memadai di mobile

- **WHEN** daftar bukti transaksi ditampilkan di mobile
- **THEN** tiap baris memiliki area tap yang cukup besar dan nyaman ditekan

### Requirement: Tombol "Buat Tagihan Bulan Ini" dapat diklik ulang setelah modal ditutup

Tombol "+ Buat Tagihan Bulan Ini" SHALL tetap responsif dan dapat memicu modal generate tagihan setiap kali ditekan, termasuk segera setelah modal sebelumnya ditutup, tanpa memerlukan scroll terlebih dahulu.

#### Scenario: Membuka ulang modal generate

- **WHEN** pengguna membuka modal generate tagihan lalu menutupnya, kemudian menekan tombol "+ Buat Tagihan Bulan Ini" lagi
- **THEN** modal generate tagihan langsung terbuka kembali tanpa perlu men-scroll halaman ke atas atau bawah lebih dulu
