## 1. Backend — Ekstrak dan buat fungsi applyPendingLateFees

- [x] 1.1 Di `hmti-backend/src/finance/dues.service.ts`, ekstrak logika penerapan denda dari `generateMonthlyDues()` (baris 105–131) ke method baru `applyPendingLateFees(): Promise<number>` yang mengembalikan jumlah dues yang diperbarui
- [x] 1.2 Method `applyPendingLateFees()` harus: ambil config aktif, query semua dues `UNPAID`/`PARTIAL` dengan `lateFeeApplied: false` dan `finalDate` sudah lewat, lalu update `amountDue += lateFee` dan `lateFeeApplied = true` untuk tiap record
- [x] 1.3 Ganti logika denda di dalam `generateMonthlyDues()` dengan panggilan ke `applyPendingLateFees()` agar tidak duplikasi

## 2. Backend — Tambah endpoint apply-late-fees

- [x] 2.1 Di `hmti-backend/src/finance/finance.controller.ts`, tambah endpoint `POST /finance/apply-late-fees` yang dilindungi `JwtAuthGuard` (tanpa `RolesGuard`) dan memanggil `duesService.applyPendingLateFees()`
- [x] 2.2 Endpoint mengembalikan `{ applied: number }` (jumlah dues yang diperbarui)

## 3. Frontend — Panggil apply-late-fees saat page load

- [x] 3.1 Di `hmti-frontend/src/views/FinanceView.vue`, tambah fungsi `applyLateFees()` yang memanggil `POST http://localhost:3000/finance/apply-late-fees` dengan header Authorization
- [x] 3.2 Di `onMounted`, panggil `applyLateFees()` terlebih dahulu (await), lalu semua fetch lainnya paralel dengan `Promise.allSettled` agar kegagalan tidak memblokir render
