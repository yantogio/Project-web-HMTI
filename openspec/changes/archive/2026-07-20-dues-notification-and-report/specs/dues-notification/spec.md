## ADDED Requirements

### Requirement: Notifikasi tagihan tampil di semua akun anggota

Sistem SHALL menampilkan notifikasi tagihan uang kas di akun anggota mana pun (bukan hanya bendahara), dengan tampilan yang serupa dengan banner tagihan yang sudah ada di akun bendahara. Notifikasi SHALL didasarkan pada data tunggakan (`Dues`) milik anggota yang sedang login, dihitung dari NIA pada sesi terautentikasi.

#### Scenario: Anggota terautentikasi membuka aplikasi

- **WHEN** seorang anggota yang terautentikasi memuat halaman yang memakai layout admin
- **THEN** sistem memeriksa status tunggakan uang kas anggota tersebut berdasarkan NIA-nya
- **AND** menampilkan notifikasi tagihan jika ia memenuhi kriteria menunggak

#### Scenario: Tampilan konsisten dengan banner bendahara

- **WHEN** notifikasi tagihan anggota ditampilkan
- **THEN** gaya visual (bentuk banner, ikon, warna aksen, dukungan mode gelap/terang) mengikuti pola banner tagihan bendahara yang sudah ada

### Requirement: Notifikasi hanya untuk anggota yang belum lunas

Sistem SHALL menampilkan notifikasi HANYA kepada anggota yang belum melunasi uang kas, yaitu yang memiliki total sisa tagihan lebih besar dari nol (status agregat `UNPAID` atau `PARTIAL`). Sistem SHALL TIDAK menampilkan notifikasi kepada anggota yang seluruh tagihannya sudah `PAID`, maupun yang `OVERPAID`/memiliki kelebihan bayar (kredit).

#### Scenario: Anggota memiliki tunggakan

- **WHEN** total sisa tagihan (amountDue − amountPaid tercakup) seorang anggota lebih besar dari nol
- **THEN** notifikasi tagihan ditampilkan kepada anggota tersebut

#### Scenario: Anggota sudah lunas

- **WHEN** seluruh tagihan anggota berstatus `PAID` dan tidak ada sisa
- **THEN** notifikasi tagihan tidak ditampilkan

#### Scenario: Anggota lebih bayar

- **WHEN** anggota memiliki kelebihan bayar (`creditBalance > 0`) atau sisa tagihan bernilai negatif
- **THEN** notifikasi tagihan tidak ditampilkan

#### Scenario: Hanya menyasar anggota aktif

- **WHEN** perhitungan penerima notifikasi dilakukan
- **THEN** hanya anggota berstatus `Aktif` yang diperhitungkan sebagai penerima notifikasi

### Requirement: Satu notifikasi per anggota meski menunggak beberapa bulan

Sistem SHALL menampilkan tepat SATU notifikasi tagihan per anggota, tanpa memandang berapa banyak periode bulan yang belum dibayar. Sistem SHALL TIDAK menampilkan dua atau lebih notifikasi terpisah untuk anggota yang sama. Total nominal pada notifikasi SHALL merupakan akumulasi seluruh sisa tagihan lintas periode yang belum lunas.

#### Scenario: Menunggak tiga bulan

- **WHEN** seorang anggota memiliki tiga periode tagihan yang belum lunas
- **THEN** hanya satu notifikasi yang ditampilkan
- **AND** nominal yang ditampilkan adalah total sisa tagihan dari ketiga periode tersebut

### Requirement: Ukuran notifikasi membesar seiring bulan tunggakan

Sistem SHALL memperbesar ukuran tampilan notifikasi secara bertahap sesuai jumlah bulan (periode) tunggakan anggota: makin banyak bulan menunggak, makin besar notifikasi. Ukuran font dan penekanan nominal total tagihan SHALL ikut menyesuaikan tingkat tunggakan tersebut, sehingga tunggakan yang lebih parah tampil lebih menonjol.

#### Scenario: Tunggakan satu bulan

- **WHEN** anggota menunggak satu bulan
- **THEN** notifikasi ditampilkan pada ukuran dasar (paling kecil)

#### Scenario: Tunggakan bertambah

- **WHEN** jumlah bulan tunggakan anggota bertambah dari periode ke periode
- **THEN** ukuran keseluruhan notifikasi, ukuran font, dan penekanan nominal meningkat mengikuti jumlah bulan tunggakan

#### Scenario: Penskalaan dibatasi

- **WHEN** jumlah bulan tunggakan sangat besar
- **THEN** ukuran notifikasi meningkat hingga batas maksimum yang wajar agar tetap terbaca dan tidak merusak tata letak halaman
