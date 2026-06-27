## ADDED Requirements

### Requirement: Bendahara dapat men-download laporan transaksi
Sistem SHALL menyediakan endpoint `GET /transactions/report` yang hanya dapat diakses oleh user dengan role `bendahara`. Endpoint menerima query param `from` (tanggal awal), `to` (tanggal akhir), dan `format` (`excel` | `word`). Sistem menghasilkan file laporan berisi data transaksi dalam rentang tersebut, kemudian mengirimnya sebagai file download.

#### Scenario: Download laporan Excel berhasil
- **WHEN** bendahara mengirim `GET /transactions/report?from=2026-01-01&to=2026-06-30&format=excel`
- **THEN** sistem merespons dengan file `.xlsx` yang dapat diunduh, dengan `Content-Disposition: attachment; filename="Laporan-Keuangan-2026-01-01-2026-06-30.xlsx"`

#### Scenario: Download laporan Word berhasil
- **WHEN** bendahara mengirim `GET /transactions/report?from=2026-01-01&to=2026-06-30&format=word`
- **THEN** sistem merespons dengan file `.docx` yang dapat diunduh

#### Scenario: Akses ditolak untuk non-bendahara
- **WHEN** user dengan role bukan `bendahara` mengakses endpoint report
- **THEN** sistem merespons dengan HTTP 403 Forbidden

### Requirement: Laporan memuat kolom yang relevan
Laporan transaksi SHALL memuat kolom berikut dalam format tabel: **No**, **Tipe** (Pemasukan / Pengeluaran), **Tanggal & Jam**, **Kategori**, **Deskripsi**, **Nominal Keluar** (diisi jika `type=out`), **Nominal Masuk** (diisi jika `type=in`), dan **Saldo dalam Periode** (running balance sejak transaksi pertama dalam rentang, dihitung secara kumulatif).

#### Scenario: Running balance dihitung dengan benar
- **WHEN** terdapat transaksi masuk Rp 500.000 diikuti pengeluaran Rp 200.000 dalam rentang laporan
- **THEN** baris pertama menampilkan "Saldo dalam Periode" = Rp 500.000 dan baris kedua = Rp 300.000

#### Scenario: Kolom nominal terisi sesuai tipe transaksi
- **WHEN** transaksi bertipe `in` dengan amount Rp 100.000
- **THEN** kolom "Nominal Masuk" berisi Rp 100.000 dan kolom "Nominal Keluar" kosong

#### Scenario: Tidak ada transaksi dalam rentang
- **WHEN** tidak ada transaksi antara tanggal `from` dan `to`
- **THEN** laporan tetap diunduh dengan tabel kosong (hanya header)

### Requirement: UI download laporan di halaman keuangan
Halaman keuangan SHALL menyediakan card/section **Download Laporan** yang hanya terlihat oleh bendahara, berisi input tanggal dari-sampai dan tombol download untuk format Excel dan Word.

#### Scenario: Bendahara mengisi rentang dan klik download Excel
- **WHEN** bendahara memilih tanggal `dari` dan `sampai`, lalu klik tombol "Download Excel"
- **THEN** browser memulai download file `.xlsx`

#### Scenario: Tombol download tidak tampil untuk non-bendahara
- **WHEN** user dengan role bukan bendahara membuka halaman keuangan
- **THEN** section download laporan tidak ditampilkan sama sekali
