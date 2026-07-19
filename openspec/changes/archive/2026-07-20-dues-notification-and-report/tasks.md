## 1. Backend — Status tunggakan anggota (notifikasi)

- [x] 1.1 Tambah method `getMemberArrears(memberNia)` di `DuesService` yang mengembalikan `{ hasArrears, unpaidMonths, totalRemaining, periods }` — `unpaidMonths` = jumlah baris `Dues` dengan sisa > 0; `totalRemaining` = akumulasi sisa; `hasArrears` = `totalRemaining > 0` dan tidak OVERPAID (kredit agregat = 0)
- [x] 1.2 Pastikan hanya diperhitungkan untuk anggota `status: 'Aktif'`; kembalikan `hasArrears: false` untuk anggota non-aktif atau tanpa tunggakan
- [x] 1.3 Tambah endpoint `GET /dues/my-arrears` (guard `JwtAuthGuard`) yang mengambil NIA dari user token dan memanggil `getMemberArrears`
- [x] 1.4 Verifikasi endpoint hanya memaparkan data milik pemohon (tidak bisa membaca tunggakan anggota lain)

## 2. Frontend — Notifikasi tagihan anggota

- [x] 2.1 Di `AdminPageLayout.vue`, tambah state + fetch ke `GET /dues/my-arrears` pada `onMounted` (sejalan pola `checkGenerateStatus`)
- [x] 2.2 Tambah satu banner notifikasi anggota (terpisah dari banner bendahara) dengan gaya visual serupa: bentuk banner, ikon, warna aksen, dukungan mode gelap/terang
- [x] 2.3 Tampilkan banner hanya bila `hasArrears === true`; render total tagihan (`totalRemaining`) dan jumlah bulan tunggakan dalam SATU banner (tidak menumpuk)
- [x] 2.4 Implementasi penskalaan ukuran berbasis tier `unpaidMonths` → kelas Tailwind (padding, `text-*`, ukuran nominal): 1 bulan dasar, bertambah bertahap, di-clamp pada maksimum yang wajar
- [x] 2.5 Uji visual: 1 bulan (kecil), beberapa bulan (membesar), banyak bulan (maksimum, tetap terbaca)

## 3. Backend — Laporan Excel status pembayaran

- [x] 3.1 Tambah method di service keuangan (`DuesService`/finance) yang menyusun daftar periode dari periode `Dues` paling awal s/d bulan berjalan
- [x] 3.2 Susun matriks: setiap anggota `Aktif` sebagai baris (termasuk yang belum punya `Dues`), setiap periode sebagai kolom status
- [x] 3.3 Tentukan isi sel per periode: nominal dibayar/lunas, "Belum Bayar", penanda denda (`lateFeeApplied`), penanda lebih bayar (`creditBalance > 0`)
- [x] 3.4 Tambah kolom ringkasan per anggota (total dibayar dan/atau total sisa tunggakan)
- [x] 3.5 Bangun workbook dengan `exceljs` mengikuti pola `transactions.service.ts#generateExcel` (judul, header, border, format rupiah); kembalikan `Buffer`
- [x] 3.6 Tambah endpoint `GET /finance/dues-report` di-guard `JwtAuthGuard` + `RolesGuard` `@Roles('bendahara')`, set header `Content-Disposition`/`Content-Type` xlsx, `res.send(buffer)`

## 4. Frontend — Tombol Laporan Uang Kas

- [x] 4.1 Di `FinanceView.vue`, tambah tombol "Laporan Uang Kas" bersebelahan dengan "Buat Tagihan Bulan Ini", hanya tampil untuk `isBendahara`
- [x] 4.2 Tambah handler unduh (pola `downloadReport`): `http.get('/finance/dues-report', { responseType: 'blob' })`, buat objek URL, trigger unduh dengan nama file berisi rentang periode
- [x] 4.3 Tambah state loading + cegah klik ganda selama proses; tampilkan toast error bila gagal

## 5. Verifikasi & QA

- [x] 5.1 Uji notifikasi end-to-end: anggota menunggak melihat 1 banner; anggota lunas/lebih bayar tidak melihat banner
- [x] 5.2 Uji laporan Excel: buka file hasil unduh, pastikan seluruh anggota aktif dan rentang periode (awal s/d bulan berjalan) benar, serta status per sel (dibayar/belum/denda/lebih bayar) akurat
- [x] 5.3 Uji otorisasi: non-bendahara tidak bisa memicu `/finance/dues-report`; anggota tidak bisa membaca tunggakan anggota lain
- [x] 5.4 Uji regresi: banner bendahara dan alur generate tagihan yang lama masih berfungsi normal
