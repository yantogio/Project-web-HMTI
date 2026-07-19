## Context

Modul keuangan HMTI sudah punya model `Dues` (satu baris per anggota per periode, dengan `amountDue`, `amountPaid`, `creditBalance`, `status`, `lateFeeApplied`) dan `FinanceConfig` (nominal iuran, denda, tanggal tenggat). `DuesService` sudah menyediakan agregasi per anggota lewat `getSummary()` dan status instan lewat `checkMemberStatus(nia)`. Banner tagihan bendahara berada di `AdminPageLayout.vue` dan memakai endpoint `GET /finance/generate-status`. Laporan keuangan Excel/Word sudah ada di `transactions.service.ts` (`generateReport` + `generateExcel`) memakai `exceljs`, dengan endpoint `GET /transactions/report` yang di-guard `@Roles('bendahara')` dan mengirim `res.send(buffer)`.

Perubahan ini menambah dua kapabilitas di atas fondasi tersebut, tanpa mengubah skema Prisma.

## Goals / Non-Goals

**Goals:**
- Menampilkan satu notifikasi tagihan per anggota di semua akun anggota, hanya untuk penunggak aktif, dengan ukuran yang membesar mengikuti jumlah bulan tunggakan.
- Mengekspor Excel rekap status pembayaran seluruh anggota aktif dari periode awal hingga bulan berjalan lewat satu tombol di halaman Keuangan.
- Menggunakan kembali pola arsitektur yang sudah ada (banner `AdminPageLayout`, `exceljs`, guard peran).

**Non-Goals:**
- Tidak mengubah skema database `Dues`/`Member`/`FinanceConfig`.
- Tidak menambah notifikasi push / email / real-time — cukup banner in-app saat halaman dimuat.
- Tidak menyertakan format Word untuk laporan uang kas (cukup Excel, sesuai permintaan).
- Tidak mengubah logika generate tagihan atau penerapan denda yang sudah ada.

## Decisions

### 1. Endpoint status tunggakan anggota untuk notifikasi
Menambah `GET /dues/my-arrears` (atau memanfaatkan `checkMemberStatus`) yang mengembalikan agregat untuk NIA pada token: `{ hasArrears: boolean, unpaidMonths: number, totalRemaining: number, periods: [...] }`. `unpaidMonths` = jumlah baris `Dues` dengan sisa > 0; `totalRemaining` = akumulasi sisa lintas periode.

- **Kenapa endpoint khusus, bukan menghitung di frontend dari `/dues/summary`?** `/dues/summary` mengembalikan seluruh anggota (data bendahara) dan tidak pantas dibuka ke semua anggota. Endpoint khusus membatasi data ke NIA sendiri dan lebih aman.
- **Alternatif dipertimbangkan:** memakai `checkMemberStatus` apa adanya — namun ia belum mengembalikan `unpaidMonths` (jumlah bulan), yang dibutuhkan untuk penskalaan ukuran. Endpoint diperluas/ditambah agar memuat hitungan bulan.
- **Kriteria tampil:** `hasArrears` true bila `totalRemaining > 0` dan `creditBalance` agregat = 0 (bukan OVERPAID). Anggota non-aktif tidak dilayani.

### 2. Satu notifikasi + penskalaan ukuran di frontend
Banner anggota baru di `AdminPageLayout.vue`, terpisah dari banner bendahara namun memakai gaya visual yang sama. Satu elemen banner saja; `totalRemaining` dan `unpaidMonths` di-render di dalamnya.

- Penskalaan memakai fungsi tingkat (tier) dari `unpaidMonths` → kelas ukuran (padding, `text-*`, ukuran nominal). Contoh pemetaan: 1 bulan = dasar, 2–3 = sedang, 4–5 = besar, ≥6 = maksimum (di-clamp).
- **Kenapa tier diskrit, bukan skala kontinu (mis. `font-size` dihitung)?** Tailwind memakai kelas utilitas; tier diskrit menjaga konsistensi desain dan mode gelap/terang, serta mencegah tata letak rusak. Batas maksimum menjaga keterbacaan (lihat spec "Penskalaan dibatasi").
- Notifikasi dihitung sekali saat `onMounted` (sejalan dengan pola `checkGenerateStatus` yang sudah ada).

### 3. Laporan Excel: matriks anggota × periode
Menambah `GET /finance/dues-report` (atau `/dues/report`) di-guard `@Roles('bendahara')`, mengembalikan buffer `.xlsx` via `res.send`, meniru `downloadReport` di frontend (`responseType: 'blob'`).

- Backend membangun daftar periode dari `min(Dues.period)` s/d bulan berjalan (server-side, berbasis `year`/`month`), lalu untuk tiap anggota aktif menyusun sel per periode dari baris `Dues` terkait.
- Isi sel mengikuti status: nominal dibayar (lunas), "Belum Bayar", penanda denda bila `lateFeeApplied`, dan penanda lebih bayar bila `creditBalance > 0`. Kolom ringkasan per anggota (total dibayar & total sisa) di ujung baris.
- **Kenapa exceljs & pola `generateExcel` yang ada?** Sudah terpasang dan terbukti; header/ border/format rupiah bisa dipakai ulang, mengurangi risiko.
- **Alternatif dipertimbangkan:** membuat Excel di frontend (mis. SheetJS) — ditolak agar tidak menambah dependency frontend dan agar sumber kebenaran perhitungan tetap di backend.

## Risks / Trade-offs

- [Rentang periode sangat lebar membuat kolom Excel membludak] → Batasi lebar kolom & andalkan bahwa umur organisasi/periode tercatat masih wajar; bila perlu, ringkas ke format ringkas per sel.
- [Anggota aktif tanpa `Dues` sama sekali] → Tetap dimunculkan sebagai baris kosong/"Belum Bayar" agar cakupan "seluruh anggota aktif" terpenuhi (lihat spec).
- [Definisi "bulan tunggakan" ambigu untuk PARTIAL] → Diputuskan: setiap baris `Dues` dengan sisa > 0 dihitung satu bulan tunggakan, termasuk PARTIAL. Penskalaan ukuran memakai hitungan ini.
- [Banner anggota dan banner bendahara tampil bersamaan untuk akun bendahara] → Bendahara umumnya tidak jadi target iuran anggota; namun bila bendahara juga menunggak, kedua banner bisa muncul. Diterima; keduanya independen dan tidak menumpuk sebagai duplikat notifikasi anggota.

## Migration Plan

1. Backend: tambah method di `DuesService` (agregasi tunggakan per NIA + builder laporan), daftarkan endpoint di controller finance/dues dengan guard peran yang sesuai. Tidak ada migrasi DB.
2. Frontend: tambah banner anggota di `AdminPageLayout.vue` dan tombol + handler unduh di `FinanceView.vue`.
3. Deploy mengikuti alur build backend (`dist/`) + frontend yang sudah ada. Rollback = revert commit; tidak ada perubahan data yang perlu dibatalkan.

## Open Questions

- Apakah endpoint laporan juga diizinkan untuk `ketum` (seperti `generate-dues`) atau hanya `bendahara` (seperti `transaction-report`)? Default proposal: ikuti `bendahara` seperti laporan keuangan; dapat ditambah `ketum` bila diinginkan.
- Format tepat sel Excel (nominal vs label "LUNAS/BELUM/DENDA") — akan difinalkan saat implementasi mengikuti "format laporan uang kas pada umumnya".
