## Why

Sistem HMTI sudah berjalan baik di desktop, tetapi pada mode mobile masih terdapat sejumlah masalah tata letak dan interaksi yang mengganggu pengguna: header tumpang tindih, area tap yang terlalu sempit, modal yang tidak bisa di-scroll atau ditutup, tabel yang memotong data, serta tab dan tombol yang sulit dijangkau. Perbaikan ini menargetkan kegunaan (usability) di layar kecil tanpa mengubah fungsionalitas yang sudah sempurna di desktop.

## What Changes

- **Header (AdminPageLayout)**: perbaiki elemen header yang tumpang tindih di mode mobile (nama user, tombol tema, tombol keluar, logo, tombol kembali) agar tidak saling menimpa pada layar sempit.
- **Tombol kembali di header**: ganti ikon tombol kembali yang ada di samping logo HMTI dengan desain tombol "kembali" yang lebih mudah dikenali pengguna, tetap selaras dengan tema keseluruhan (desktop & mobile, mode terang & gelap).
- **Halaman Keuangan — bukti transaksi**: jadikan seluruh baris entri bukti transaksi dapat di-tap untuk membuka bukti, bukan hanya area ikon.
- **Halaman Keuangan — tombol "Buat Tagihan Bulan Ini"**: perbaiki bug interaksi di mana setelah modal generate ditutup, tombol tidak dapat diklik ulang kecuali halaman di-scroll sedikit terlebih dahulu.
- **Halaman Anggota — layer modal tambah/edit**: naikkan z-index modal tambah & edit anggota agar berada di lapisan paling atas, di atas banner notifikasi tagihan bulanan.
- **Halaman Anggota — modal responsif di mobile**: buat modal tambah/edit anggota bisa di-scroll penuh sampai tombol submit terlihat, dan sediakan cara jelas untuk menutup modal di mode mobile.
- **Halaman Anggota — tabel anggota**: buat tabel anggota lebih responsif sehingga kolom/data yang ditampilkan dapat menyesuaikan pengguna mobile.
- **Halaman Dokumentasi — tab (Arsip / Media / Branding)**: sesuaikan tab agar muat di layar mobile tanpa harus menggeser ke samping untuk memilih opsi lain.
- **Halaman Dokumentasi — tabel arsip surat**: perbaiki tampilan mobile tabel arsip surat agar menampilkan data yang memadai beserta aksi (yang saat ini hilang di mobile).

Non-goals: perubahan pada logika bisnis backend, skema data, atau tampilan desktop yang sudah dianggap sempurna. Semua perubahan bersifat presentasional/interaksi front-end.

## Capabilities

### New Capabilities
- `mobile-responsive-ui`: Standar dan persyaratan lintas-halaman untuk tata letak & interaksi responsif di mobile — non-overlap header, redesign tombol kembali, pola modal mobile (scroll penuh + tombol tutup), serta pola tabel/tab yang adaptif.

### Modified Capabilities
- `finance-view`: Area tap bukti transaksi diperluas ke seluruh baris; perbaikan bug tombol "Buat Tagihan Bulan Ini" agar dapat diklik ulang setelah modal ditutup.
- `member-management`: Layering modal tambah/edit di atas banner notifikasi; modal dapat di-scroll dan ditutup di mobile; tabel anggota responsif.
- `docs-view`: Tab Arsip/Media/Branding adaptif untuk mobile; tabel arsip surat menampilkan data & aksi yang memadai di mobile.

## Impact

- **Kode terpengaruh (frontend Vue 3 + Tailwind)**:
  - `hmti-frontend/src/components/AdminPageLayout.vue` (header, tombol kembali, banner)
  - `hmti-frontend/src/views/FinanceView.vue` (bukti transaksi, tombol generate tagihan)
  - `hmti-frontend/src/views/Anggota.vue` (modal tambah/edit, tabel anggota)
  - `hmti-frontend/src/views/DocsView.vue` (tab, tabel arsip surat)
- **Tidak ada perubahan**: backend, API, skema database, atau dependency.
- **Risiko**: rendah — perubahan bersifat CSS/markup/interaksi; perlu verifikasi manual lintas breakpoint (mobile/desktop) dan tema (terang/gelap).
