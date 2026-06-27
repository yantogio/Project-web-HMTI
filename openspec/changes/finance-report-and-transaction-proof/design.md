## Context

Halaman keuangan (`FinanceView.vue`) saat ini mendukung pencatatan transaksi masuk/keluar oleh bendahara via JSON `POST /transactions`, dan menampilkan timeline transaksi ke semua anggota. Backend menggunakan NestJS + Prisma (SQLite), dan `GoogleDriveService` sudah ada untuk upload file ke Google Drive. Model `Transaction` belum memiliki field untuk bukti transaksi atau metode pembayaran.

Dua fitur baru ditambahkan:
1. **Download laporan transaksi** (Excel/Word) dengan filter rentang tanggal — hanya untuk bendahara.
2. **Upload bukti transaksi** saat input transaksi, dengan aturan berbeda per tipe; plus card baru untuk melihat daftar bukti transaksi (akses semua anggota).

## Goals / Non-Goals

**Goals:**
- Endpoint `GET /transactions/report` yang menghasilkan file Excel atau Word, difilter by `from`/`to` date, berisi kolom tipe, tanggal-jam, deskripsi, nominal keluar, nominal masuk, dan running balance.
- `POST /transactions` diubah ke `multipart/form-data` untuk mendukung upload file bukti opsional/wajib tergantung konteks.
- Field baru `proofDriveFileId`, `proofUrl`, dan `paymentMethod` pada model `Transaction`.
- File disimpan ke Google Drive folder `Bukti Transaksi` (ID: `1nf_Pk_aOgqt_uy6iQiSn5hmQyhH90Dis`) via `GoogleDriveService` yang sudah ada.
- Card baru di halaman keuangan: daftar bukti transaksi (list sederhana), klik buka Google Drive.

**Non-Goals:**
- Preview thumbnail gambar bukti di dalam aplikasi (cukup link ke Drive).
- Fitur hapus atau edit bukti transaksi yang sudah diupload.
- Autentikasi khusus untuk card bukti transaksi (ikut akses halaman keuangan yang sudah ada).

## Decisions

### 1. Format multipart/form-data untuk POST /transactions
**Keputusan**: Ubah endpoint `POST /transactions` dari `application/json` ke `multipart/form-data`.

**Alasan**: Ini satu-satunya cara mengirim file bersama data JSON dalam satu request HTTP. Alternatif (dua request terpisah — satu JSON, satu upload) menimbulkan risiko data tidak konsisten jika salah satu request gagal.

**Cara**: Gunakan `@nestjs/platform-express` + `multer` (sudah ter-install bersama NestJS). Field JSON dikirim sebagai field form (`type`, `amount`, `category`, `description`, `subCategory`, `targetNia`, `paymentMethod`) dan file dikirim sebagai field `proof`. Di backend, `@UseInterceptors(FileInterceptor('proof'))`.

### 2. Library report: exceljs + docx
**Keputusan**: `exceljs` untuk Excel (`.xlsx`) dan `docx` untuk Word (`.docx`).

**Alasan**: `exceljs` adalah library paling matang dan aktif untuk Excel di Node.js tanpa ketergantungan Office. `docx` (npm: `docx`) memungkinkan pembuatan `.docx` murni tanpa LibreOffice atau COM interop. Alternatif seperti `xlsx` (SheetJS) untuk Excel tidak mendukung format Word sama sekali.

**Cara**: Backend generate file in-memory (Buffer), kirim via `res.setHeader('Content-Disposition', ...)` + `res.send(buffer)`. Frontend trigger download via `<a>` tag dengan Blob URL.

### 3. Running balance dihitung server-side
**Keputusan**: Kalkulasi saldo berjalan dilakukan di backend saat generate laporan, bukan disimpan di DB.

**Alasan**: Menyimpan saldo berjalan di setiap row transaksi akan menimbulkan masalah konsistensi data saat ada transaksi yang diedit atau dihapus di masa depan. Server-side calculation saat generate report adalah approach yang lebih aman — ambil semua transaksi dalam rentang, sort by `date` ASC, hitung running balance dari nol.

**Catatan**: Running balance dalam laporan dihitung dari transaksi pertama dalam rentang waktu yang dipilih, bukan saldo kumulatif keseluruhan. Ini perlu dijelaskan ke user di label kolom (misal: "Saldo (dalam periode)").

### 4. Folder Drive terpisah untuk Bukti Transaksi
**Keputusan**: Gunakan folder Drive khusus dengan ID `1nf_Pk_aOgqt_uy6iQiSn5hmQyhH90Dis` (sudah dibuat oleh user), bukan folder dokumen utama.

**Alasan**: Memisahkan file bukti transaksi dari dokumen organisasi umum agar mudah dikelola dan tidak bercampur.

**Cara**: Pass `targetFolderId` ke `GoogleDriveService.uploadFile()` — method ini sudah mendukung parameter ini.

### 5. Aturan validasi bukti transaksi di frontend
**Keputusan**: Validasi dilakukan di frontend sebelum submit; backend tetap menerima upload opsional tapi frontend enforce wajib sesuai aturan.

**Alasan**: UX lebih cepat (tidak perlu round-trip ke server untuk error validasi sederhana). Backend tetap fleksibel untuk use case API langsung.

Aturan:
- Kas Anggota + Cash → tidak perlu bukti
- Kas Anggota + Non-Cash → bukti wajib
- Dana Eksternal → bukti wajib
- Pengeluaran → bukti wajib

### 6. Card Bukti Transaksi: filter dari data transaksi yang sudah ada
**Keputusan**: Endpoint `GET /transactions` sudah ada; tambah property `proofUrl` dan `proofDriveFileId` di response. Frontend filter transaksi yang memiliki `proofUrl` untuk ditampilkan di card.

**Alasan**: Tidak perlu endpoint baru. Semua data transaksi sudah di-fetch saat halaman load. Filter client-side efisien untuk jumlah data yang diperkirakan (ratusan, bukan jutaan transaksi).

## Risks / Trade-offs

- **[Risk] File besar menyebabkan timeout saat generate report** → Mitigation: Laporan di-generate in-memory dan langsung di-stream. Untuk data besar, pertimbangkan pagination di masa depan (out of scope sekarang).
- **[Risk] Upload file gagal tapi data transaksi tersimpan** → Mitigation: Upload dilakukan dulu sebelum simpan ke DB. Jika upload gagal, transaksi tidak disimpan (throw error di service sebelum `prisma.transaction.create`).
- **[Risk] SQLite tidak cocok untuk produksi dengan file besar** → Di luar scope; project ini skala organisasi kecil.
- **[Trade-off] Running balance dalam laporan bukan saldo aktual organisasi** → Ini disadari; saldo dihitung dari `0` dalam periode yang dipilih, bukan saldo awal sesungguhnya. Dapat diatasi dengan menyediakan note di laporan.

## Migration Plan

1. Tambah field baru ke `schema.prisma` (`proofDriveFileId?`, `proofUrl?`, `paymentMethod?`).
2. Jalankan `npx prisma migrate dev --name add_transaction_proof_and_payment_method`.
3. Deploy backend changes (tidak ada breaking change pada endpoint yang ada karena field baru optional).
4. Deploy frontend changes.
5. Rollback: field `?` (optional) sehingga data lama tetap valid tanpa proof.

## Open Questions

- Apakah laporan Excel perlu styling (header tebal, warna baris alternating) atau plain table sudah cukup? → Asumsi: styling sederhana (header tebal, border).
- Format nama file laporan yang didownload: `Laporan-Transaksi-{from}-{to}.xlsx` atau format lain? → Asumsi: `Laporan-Keuangan-{from}-{to}.{ext}`.
