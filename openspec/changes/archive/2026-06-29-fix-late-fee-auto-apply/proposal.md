## Why

Denda keterlambatan (`lateFee`) hanya diterapkan saat bendahara men-generate tagihan bulan baru, sehingga anggota yang belum bayar **setelah melewati `finalDay`** tetap melihat tagihan tanpa denda — meski seharusnya sudah kena denda. Ini menyebabkan data tagihan tidak akurat dan tidak mencerminkan kondisi nyata.

## What Changes

- Tambah fungsi `applyPendingLateFees()` di `DuesService` yang memproses semua tagihan UNPAID/PARTIAL yang `finalDate`-nya sudah lewat dan `lateFeeApplied = false`
- Tambah endpoint `POST /finance/apply-late-fees` yang bisa dipanggil oleh bendahara maupun dipanggil otomatis saat halaman keuangan dimuat
- Frontend memanggil endpoint ini saat halaman `FinanceView` di-mount, agar data summary selalu up-to-date
- Endpoint `GET /dues/summary` tetap membaca data dari database (tidak berubah secara skema), tapi database sudah diperbarui oleh mekanisme apply di atas

## Capabilities

### New Capabilities
- `late-fee-application`: Kemampuan menerapkan denda keterlambatan secara otomatis ke tagihan UNPAID/PARTIAL yang telah melewati tanggal akhir bayar (`finalDate`), tanpa perlu menunggu generate tagihan bulan berikutnya

### Modified Capabilities
- `finance-view`: Halaman keuangan kini memicu penerapan denda otomatis saat dimuat, sehingga data status tagihan anggota selalu akurat

## Impact

- **Backend**: `hmti-backend/src/finance/dues.service.ts` — tambah metode baru; `hmti-backend/src/finance/finance.controller.ts` — tambah endpoint baru
- **Frontend**: `hmti-frontend/src/views/FinanceView.vue` — panggil endpoint `apply-late-fees` saat `onMounted`
- **Database**: Field `amountDue` dan `lateFeeApplied` pada tabel `dues` diperbarui saat denda diterapkan (sudah ada, tidak ada perubahan skema)
