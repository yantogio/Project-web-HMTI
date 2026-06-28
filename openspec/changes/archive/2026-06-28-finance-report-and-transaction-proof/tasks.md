## 1. Database & Migrasi

- [x] 1.1 Tambah field `proofUrl String?`, `proofDriveFileId String?`, dan `paymentMethod String?` ke model `Transaction` di `hmti-backend/prisma/schema.prisma`
- [x] 1.2 Jalankan `npx prisma migrate dev --name add_transaction_proof_and_payment_method` dan pastikan migrasi berhasil

## 2. Backend — Dependensi Baru

- [x] 2.1 Install library `exceljs` untuk generate laporan Excel: `npm install exceljs`
- [x] 2.2 Install library `docx` untuk generate laporan Word: `npm install docx`
- [x] 2.3 Pastikan `@nestjs/platform-express` dan `multer` sudah tersedia (biasanya sudah ada bersama NestJS); jika belum install `@types/multer`

## 3. Backend — Modifikasi TransactionsController & Service

- [x] 3.1 Modifikasi `POST /transactions` di `hmti-backend/src/transactions/transactions.controller.ts` untuk menerima `multipart/form-data` menggunakan `@UseInterceptors(FileInterceptor('proof'))` dan decorator `@UploadedFile()`
- [x] 3.2 Modifikasi `TransactionsService.create()` di `hmti-backend/src/transactions/transactions.service.ts`: jika ada file `proof`, panggil `GoogleDriveService.uploadFile(file, '1nf_Pk_aOgqt_uy6iQiSn5hmQyhH90Dis')` **sebelum** `prisma.transaction.create()`, lalu simpan `proofUrl` dan `proofDriveFileId` ke data transaksi
- [x] 3.3 Simpan field `paymentMethod` dari body form ke data transaksi saat create
- [x] 3.4 Inject `GoogleDriveService` ke `TransactionModule` — tambahkan `DocumentsModule` (atau `GoogleDriveService` langsung) ke imports `transaction.module.ts`

## 4. Backend — Endpoint Laporan Transaksi

- [x] 4.1 Tambah method `generateReport(from: string, to: string, format: 'excel' | 'word')` di `TransactionsService` yang mengambil transaksi dalam rentang tanggal, sort by `date` ASC, dan menghitung running balance
- [x] 4.2 Implementasi generate Excel menggunakan `exceljs`: buat workbook dengan sheet "Laporan Keuangan", kolom (No, Tipe, Tanggal & Jam, Kategori, Deskripsi, Nominal Keluar, Nominal Masuk, Saldo dalam Periode), header tebal dan border, kemudian return sebagai Buffer
- [x] 4.3 Implementasi generate Word menggunakan `docx`: buat dokumen dengan judul laporan dan tabel dengan kolom yang sama, return sebagai Buffer
- [x] 4.4 Tambah endpoint `GET /transactions/report` di `TransactionsController` dengan guard `JwtAuthGuard` + `RolesGuard` + `@Roles('bendahara')`, query params `from`, `to`, `format`; set `Content-Disposition` dan `Content-Type` header yang sesuai kemudian kirim buffer

## 5. Frontend — Modifikasi Form Input Pemasukan (Modal)

- [x] 5.1 Tambah state `paymentMethod = ref('cash')` dan `proofFile = ref(null)` ke `FinanceView.vue`
- [x] 5.2 Pada section form tab "Kas Anggota" di modal, tambah UI pilihan radio/toggle `Cash` / `Non-Cash` yang terhubung ke `paymentMethod`
- [x] 5.3 Tampilkan field `<input type="file">` hanya saat `paymentMethod === 'non-cash'` (v-if) dan tandai sebagai required
- [x] 5.4 Pada section form tab "Dana Eksternal" di modal, tambah field `<input type="file">` yang selalu tampil dan required
- [x] 5.5 Modifikasi fungsi `saveTransaction()`: ubah dari `axios.post(url, jsonPayload)` ke `FormData` — append semua field sebagai form data dan append file jika ada
- [x] 5.6 Tambah validasi di `saveTransaction()` sebelum submit: jika kas anggota + non-cash tanpa file → alert error; jika dana eksternal tanpa file → alert error; jika pengeluaran tanpa file → alert error
- [x] 5.7 Tambah suffix `[Cash]` atau `[Non-Cash]` ke field `description` saat menyiapkan payload untuk transaksi kas anggota

## 6. Frontend — Modifikasi Form Input Pengeluaran (Modal)

- [x] 6.1 Pada section form modal pengeluaran, tambah field `<input type="file">` yang selalu tampil dan required
- [x] 6.2 Pastikan `saveTransaction()` untuk tipe `out` juga menggunakan `FormData` dan menyertakan file bukti

## 7. Frontend — Card Download Laporan

- [x] 7.1 Tambah card/section "Download Laporan" di `FinanceView.vue` yang hanya ditampilkan jika `isBendahara.value === true` (v-if)
- [x] 7.2 Tambah dua input date (`dari` dan `sampai`) dan dua tombol "Download Excel" dan "Download Word"
- [x] 7.3 Implementasi fungsi `downloadReport(format)` yang memanggil `GET /transactions/report?from=...&to=...&format=...` dengan header Authorization, kemudian trigger download file menggunakan Blob URL (`URL.createObjectURL(blob)`) dan elemen `<a>` temporary

## 8. Frontend — Card Bukti Transaksi

- [x] 8.1 Tambah card baru "Bukti Transaksi" di `FinanceView.vue`, tampil untuk semua anggota yang sudah login
- [x] 8.2 Buat computed property `transactionsWithProof` yang memfilter `transactions.value` untuk item yang memiliki `proofUrl` tidak null/kosong
- [x] 8.3 Render daftar item dengan nama `{kategori} — {deskripsi}` dan tanggal transaksi sebagai informasi sekunder
- [x] 8.4 Setiap item dibungkus tag `<a>` dengan `href="{proofUrl}"` dan `target="_blank"` sehingga klik membuka Google Drive di tab baru
- [x] 8.5 Tampilkan pesan kosong "Belum ada bukti transaksi yang diupload" ketika `transactionsWithProof` kosong
- [x] 8.6 Terapkan styling yang konsisten dengan card-card lain di halaman (gunakan `themeClasses.cardGlass` dan `themeClasses.cardContent`)

## 9. Verifikasi & Testing

- [x] 9.1 Test alur lengkap: input pemasukan kas anggota Non-Cash → upload file → cek `proofUrl` tersimpan di DB dan muncul di card Bukti Transaksi
- [x] 9.2 Test alur: input pemasukan kas anggota Cash → tidak perlu file → transaksi tersimpan tanpa error
- [x] 9.3 Test alur: input dana eksternal → upload wajib → cek transaksi tersimpan dengan proof
- [x] 9.4 Test alur: input pengeluaran → upload wajib → cek transaksi tersimpan dengan proof
- [x] 9.5 Test download laporan Excel dan Word dengan rentang tanggal yang valid, cek file ter-download dan data sesuai
- [x] 9.6 Test running balance: verifikasi kalkulasi saldo berjalan benar di laporan
- [x] 9.7 Test akses: non-bendahara tidak melihat card download laporan; semua anggota melihat card bukti transaksi
