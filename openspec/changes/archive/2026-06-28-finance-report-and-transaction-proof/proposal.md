## Why

Halaman keuangan saat ini belum mendukung pembuatan laporan transaksi yang bisa diunduh, sehingga bendahara harus membuat laporan secara manual. Selain itu, tidak ada mekanisme upload dan akses bukti transaksi, sehingga keabsahan setiap transaksi tidak dapat diverifikasi oleh anggota maupun pengurus.

## What Changes

- Tambah endpoint backend untuk generate dan download laporan transaksi dalam format **Excel** dan **Word**, dengan filter rentang tanggal (dari periode ke periode).
- Laporan memuat kolom: tipe transaksi (masuk/keluar), tanggal & jam, deskripsi, nominal keluar, nominal masuk, dan saldo berjalan setelah transaksi.
- Tambah field `proofDriveFileId` dan `proofUrl` pada model `Transaction` di Prisma untuk menyimpan referensi bukti transaksi di Google Drive.
- Tambah field `paymentMethod` (`cash` | `non-cash`) pada model `Transaction` untuk mencatat metode pembayaran kas anggota.
- Pada form **Input Pemasukan** tab **Kas Anggota**: tambah opsi pilihan `Cash` / `Non-Cash`. Jika Non-Cash, upload bukti transaksi wajib. Field keterangan otomatis diisi dengan metode pembayaran.
- Pada form **Input Pemasukan** tab **Dana Eksternal**: upload bukti transaksi wajib.
- Pada form **Input Pengeluaran**: upload bukti transaksi wajib.
- Tambah card baru **Bukti Transaksi** di halaman keuangan (akses semua anggota): menampilkan list sederhana bukti transaksi (nama dari kategori + deskripsi), klik membuka Google Drive.
- Penyimpanan file ke folder Google Drive `Bukti Transaksi` (ID: `1nf_Pk_aOgqt_uy6iQiSn5hmQyhH90Dis`), menggunakan `GoogleDriveService` yang sudah ada.

## Capabilities

### New Capabilities
- `transaction-report-export`: Kemampuan bendahara men-download laporan transaksi (Excel/Word) dengan filter rentang tanggal, memuat kolom tipe, tanggal, deskripsi, nominal, dan saldo berjalan.
- `transaction-proof-upload`: Kemampuan upload bukti transaksi (gambar/PDF) ke Google Drive saat input pemasukan (kas anggota non-cash wajib, dana eksternal wajib) dan input pengeluaran (wajib), dengan metadata tersimpan di field Transaction.
- `transaction-proofs-list`: Card baru di halaman keuangan yang menampilkan daftar bukti transaksi yang sudah diupload, dapat diakses semua anggota, dengan link langsung ke Google Drive.

### Modified Capabilities
<!-- Tidak ada perubahan spec-level pada kapabilitas yang sudah ada. -->

## Impact

- **Backend**:
  - `hmti-backend/prisma/schema.prisma` — tambah field `proofDriveFileId`, `proofUrl`, `paymentMethod` pada model `Transaction`.
  - `hmti-backend/src/transactions/transactions.service.ts` — modifikasi `create()` untuk handle upload bukti, tambah method `generateReport()`.
  - `hmti-backend/src/transactions/transactions.controller.ts` — tambah endpoint `GET /transactions/report` dengan query param `from`, `to`, `format` (`excel`|`word`); modifikasi `POST /transactions` untuk terima file multipart.
  - `hmti-backend/src/documents/google-drive.service.ts` — reuse `uploadFile()` dengan folder ID `Bukti Transaksi`.
  - Dependensi baru: `exceljs` (Excel), `docx` (Word), `@nestjs/platform-express` + `multer` (file upload).
- **Frontend**:
  - `hmti-frontend/src/views/FinanceView.vue` — modifikasi form pemasukan & pengeluaran, tambah card Bukti Transaksi, tambah tombol download laporan.
- **Database**: Migrasi Prisma untuk field baru pada `Transaction`.
