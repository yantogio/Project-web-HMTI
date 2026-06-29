## Context

Sistem keuangan HMTI memiliki konsep `finalDay` — tanggal akhir bayar iuran per bulan. Jika anggota belum bayar setelah tanggal tersebut, mereka seharusnya dikenakan `lateFee`. Saat ini, logika penerapan denda (`applyPendingLateFees`) hanya berjalan sebagai bagian dari `generateMonthlyDues()` — artinya denda baru diterapkan ke database saat bendahara secara manual men-generate tagihan bulan berikutnya. Akibatnya, anggota UNPAID di bulan berjalan tidak pernah mendapat denda meski sudah melewati `finalDay`.

Stack: NestJS (backend) + Vue 3 (frontend) + Prisma + PostgreSQL.

## Goals / Non-Goals

**Goals:**
- Denda diterapkan ke database secara aktual segera ketika halaman keuangan dibuka (atau saat bendahara memicu secara manual)
- Tagihan UNPAID/PARTIAL yang `finalDate`-nya sudah lewat dan `lateFeeApplied = false` mendapat `amountDue += lateFee` dan `lateFeeApplied = true`
- Tidak mengubah skema database
- Idempoten: memanggil endpoint berkali-kali tidak menggandakan denda

**Non-Goals:**
- Penjadwalan otomatis (cron job) — cukup dipicu saat page load
- Notifikasi push ke anggota
- Perubahan skema Prisma

## Decisions

### 1. Pendekatan: Apply-on-read vs Dedicated Endpoint

**Pilihan:**
- A) Hitung denda secara dinamis di `getSummary()` tanpa mengubah database (virtual field)
- B) Buat endpoint `POST /finance/apply-late-fees` yang memperbarui database, dipanggil saat page load
- C) Cron job terjadwal di backend

**Keputusan: Pilihan B**

Alasan: Pilihan A tidak mengupdate database sehingga data akan tetap salah di query lain (mis. `applyMemberPayment` menghitung dari `amountDue` di DB). Pilihan C over-engineered untuk kebutuhan ini. Pilihan B sederhana, idempoten, dan konsisten — database selalu mencerminkan kondisi nyata.

### 2. Siapa yang boleh memanggil endpoint?

Endpoint `POST /finance/apply-late-fees` dilindungi oleh `JwtAuthGuard` saja (bukan hanya bendahara), karena dipanggil otomatis saat siapapun membuka halaman keuangan. Logika penerapan denda sendiri bersifat read-only terhadap config dan update-only terhadap dues yang eligible.

### 3. Ekstraksi logika denda dari `generateMonthlyDues`

Logika iterasi dues lama yang belum lunas dan pengecekan `finalDate` sudah ada di `generateMonthlyDues()` (baris 105–131). Logika ini akan diekstrak ke method `applyPendingLateFees()` yang standalone. `generateMonthlyDues()` kemudian memanggil method baru ini, menghilangkan duplikasi.

## Risks / Trade-offs

- **Race condition ringan**: Jika dua request `apply-late-fees` masuk bersamaan, keduanya query dues yang `lateFeeApplied = false` sebelum salah satu selesai update. Mitigasi: Karena update dilakukan satu per satu dan Prisma/PostgreSQL menjamin atomicity per-row, worst case satu dues diproses dua kali — tapi `lateFeeApplied: true` pada update pertama akan membuat query kedua tidak menemukan baris itu lagi (karena where clause `lateFeeApplied: false`). Risiko rendah.
- **Performa**: Jika jumlah dues sangat besar, query bisa lambat. Mitigasi: Query sudah difilter oleh `status: { in: ['UNPAID', 'PARTIAL'] }` dan `lateFeeApplied: false`, sehingga dataset kecil.
- **UX**: Page load frontend sedikit lebih lambat karena satu API call tambahan. Mitigasi: Panggil secara fire-and-forget (tanpa menunggu response sebelum render), atau panggil paralel dengan fetch lainnya.

## Migration Plan

1. Deploy backend dengan method dan endpoint baru
2. Deploy frontend dengan penambahan `fetchAndApplyLateFees()` di `onMounted`
3. Tidak ada migrasi database — skema tidak berubah
4. Rollback: Hapus panggilan di frontend; endpoint tidak merusak data jika tidak dipanggil
