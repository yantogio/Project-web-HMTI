## Why

Anggota yang belum membayar uang kas saat ini tidak mendapat pengingat apa pun di akun mereka — hanya bendahara yang melihat banner "Tagihan Bulan Ini Belum Dibuat". Akibatnya tunggakan menumpuk tanpa disadari anggota, dan bendahara tidak punya rekap status pembayaran per anggota yang bisa dibagikan atau diarsipkan. Kedua fitur ini menutup celah komunikasi (mengingatkan anggota yang benar-benar menunggak) sekaligus melengkapi kebutuhan pelaporan resmi HMTI.

## What Changes

- **Notifikasi tagihan untuk semua akun anggota**: menampilkan banner/notifikasi tagihan uang kas di akun anggota mana pun (bukan hanya bendahara), dengan tampilan serupa banner tagihan yang sudah ada di akun bendahara.
  - Notifikasi hanya muncul untuk anggota yang **belum lunas** (status `UNPAID`/`PARTIAL` dengan `remaining > 0`). Anggota yang sudah `PAID` atau `OVERPAID`/kelebihan bayar tidak melihat notifikasi.
  - Terhubung dengan data keuangan (`Dues`) dan anggota (`Member`) sehingga hanya menyasar anggota aktif yang menunggak.
  - Untuk anggota yang menunggak beberapa bulan, tetap **satu notifikasi saja** (tidak menumpuk dua atau lebih), namun **ukurannya membesar bertahap** seiring jumlah bulan tunggakan — ukuran font dan penekanan nominal total tagihan ikut menyesuaikan tingkat tunggakan.
- **Laporan status pembayaran anggota (Excel)**: menambah tombol **"Laporan Uang Kas"** di samping tombol "Buat Tagihan Bulan Ini" di halaman Keuangan.
  - Saat diklik, mengunduh file Excel berisi rekap pembayaran uang kas **seluruh anggota aktif** dari periode paling awal yang tercatat hingga bulan saat tombol diklik.
  - Setiap bulan menampilkan status per anggota (mis. nominal dibayar, belum bayar, kena denda, lebih bayar) mengikuti format laporan uang kas pada umumnya.

## Capabilities

### New Capabilities
- `dues-notification`: Notifikasi tagihan uang kas di sisi anggota — kriteria kemunculan (hanya penunggak aktif), aturan satu-notifikasi-per-anggota, dan penskalaan ukuran berdasarkan jumlah bulan tunggakan.
- `dues-payment-report`: Ekspor Excel rekap status pembayaran uang kas seluruh anggota aktif dari periode awal hingga bulan berjalan, beserta tombol pemicunya di halaman Keuangan.

### Modified Capabilities
<!-- Tidak ada requirement spec existing yang berubah; kedua fitur bersifat aditif. -->

## Impact

- **Backend (NestJS)**:
  - `finance`/`dues` module: endpoint baru untuk (a) status tunggakan per anggota yang dipakai notifikasi, dan (b) generate laporan Excel status pembayaran seluruh anggota aktif.
  - `DuesService`: fungsi agregasi tunggakan per anggota (jumlah bulan menunggak + total sisa tagihan) dan penyusunan matriks pembayaran per periode.
  - Menggunakan dependency yang sudah ada: `exceljs` (pola mirip `transactions.service.ts#generateExcel`).
- **Frontend (Vue)**:
  - `AdminPageLayout.vue`: menambah banner notifikasi anggota berdampingan dengan banner bendahara yang sudah ada, dengan penskalaan ukuran dinamis.
  - `FinanceView.vue`: menambah tombol "Laporan Uang Kas" + handler unduh blob (pola mirip `downloadReport`).
- **Data**: hanya membaca model `Dues`, `Member`, `FinanceConfig` yang sudah ada — tidak ada perubahan skema Prisma.
- **Otorisasi**: endpoint notifikasi dapat diakses semua anggota terautentikasi (data dibatasi ke NIA sendiri); endpoint laporan dibatasi role `bendahara` (dan/atau `ketum`) mengikuti pola `transaction-report-export`.
