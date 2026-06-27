## 1. Backend — Endpoint Generate Template Excel

- [x] 1.1 Tambah method `generateImportTemplate(): Promise<Buffer>` di `hmti-backend/src/members/members.service.ts` menggunakan `exceljs`: buat workbook dengan sheet "Import Anggota", judul di baris 1, header kolom di baris 3 (NIA, NPM, Nama Lengkap, Angkatan, Jabatan, Role, Status), baris contoh di baris 4, dan baris keterangan nilai yang diizinkan di baris 5–6 (style warna berbeda agar mudah dibedakan)
- [x] 1.2 Tambah endpoint `GET /members/import-template` di `hmti-backend/src/members/members.controller.ts` — inject `@Res() res: Response` (gunakan `import type`), set header `Content-Disposition` dan `Content-Type` xlsx, kirim buffer dari `generateImportTemplate()`

## 2. Backend — Endpoint Import Massal

- [x] 2.1 Tambah method `importFromExcel(file: Express.Multer.File): Promise<{ imported: number; skipped: number; errors: Array<{ row: number; reason: string }> }>` di `MembersService`: parse file buffer dengan `exceljs`, iterasi setiap baris mulai baris 5 (lewati header + contoh + keterangan), ekstrak 7 kolom, trim + lowercase role sebelum validasi
- [x] 2.2 Di dalam method tersebut, validasi per baris: cek field wajib tidak kosong (NIA, NPM, Nama, Angkatan, Jabatan, Role); cek role adalah salah satu dari `['ketum', 'sekretaris', 'bendahara', 'anggota']`; jika tidak valid, push ke array `errors` dan `continue`
- [x] 2.3 Untuk setiap baris valid, hash password `"password123"` dengan `bcrypt.hash("password123", 10)`, lalu panggil `prisma.member.create()` dalam try-catch; jika catch error karena unique constraint (NIA/NPM duplikat), push ke `errors` dengan keterangan yang sesuai; jika berhasil, increment `imported`
- [x] 2.4 Tambah endpoint `POST /members/import` di `MembersController` dengan `@UseInterceptors(FileInterceptor('file'))` dan `@UploadedFile() file?: Express.Multer.File`; validasi file ada dan mimetype adalah xlsx; kembalikan hasil dari `importFromExcel()`

## 3. Frontend — Tombol Download Template

- [x] 3.1 Tambah fungsi `downloadTemplate()` di `Anggota.vue`: panggil `GET http://localhost:3000/members/import-template` dengan `responseType: 'blob'`, lalu trigger download via `URL.createObjectURL` dan elemen `<a>` temporary (pola sama seperti `downloadReport()` di FinanceView)
- [x] 3.2 Tambah tombol "Download Template" di template `Anggota.vue`, tampilkan hanya saat `canManageData`, di area yang berdekatan dengan tombol Import Excel (akan dibuat di task berikutnya)

## 4. Frontend — Modal Import Excel

- [x] 4.1 Tambah state baru di `Anggota.vue`: `isImportModalOpen = ref(false)`, `importFile = ref(null)`, `isImporting = ref(false)`, `importResult = ref(null)` (null = belum ada hasil, object = tampilkan hasil)
- [x] 4.2 Tambah fungsi `openImportModal()` yang set `isImportModalOpen = true` dan reset `importFile`, `importResult`; tambah fungsi `closeImportModal()` yang reset semua state import
- [x] 4.3 Tambah fungsi `handleImportFile(e)` yang menyimpan `e.target.files[0]` ke `importFile.value`; validasi ekstensi harus `.xlsx` dan tampilkan `toastWarning` jika bukan
- [x] 4.4 Tambah fungsi `submitImport()` dengan guard `isImporting.value`: buat `FormData`, append `importFile.value` sebagai field `file`, POST ke `http://localhost:3000/members/import` dengan header Authorization dan Content-Type multipart/form-data; setelah selesai, set `importResult.value = res.data`; jika `imported > 0`, panggil `fetchMembers()`
- [x] 4.5 Tambah tombol "Import Excel" di template `Anggota.vue` di area `canManageData`, berdampingan dengan tombol "Tambah Anggota" atau sebagai card aksi cepat tambahan

## 5. Frontend — Template Modal Import di HTML

- [x] 5.1 Tambah modal import di bagian bawah template `Anggota.vue` (sebelum tag penutup `</AdminPageLayout>`): overlay gelap + card modal dengan judul "Import Anggota dari Excel"
- [x] 5.2 Isi modal langkah 1 (saat `importResult === null`): input file (`accept=".xlsx"`), nama file yang dipilih, tombol "Proses Import" (disabled saat tidak ada file atau `isImporting`), tombol "Batal"
- [x] 5.3 Isi modal langkah 2 (saat `importResult !== null`): tampilkan badge hijau "N anggota berhasil ditambahkan", badge kuning "N dilewati/error", daftar error per baris jika ada (format: "Baris X: [alasan]"), tombol "Tutup"

## 6. Verifikasi

- [x] 6.1 Test download template: klik "Download Template" → file xlsx terdownload, buka di Excel/Sheets, cek header kolom benar dan keterangan nilai tersedia
- [x] 6.2 Test import valid: isi template dengan 3 data baru, import → cek response `imported: 3`, cek tabel anggota ter-refresh dengan data baru
- [x] 6.3 Test import dengan duplikat NIA: isi satu baris dengan NIA yang sudah ada → cek baris tersebut masuk ke errors, baris lain tetap berhasil
- [x] 6.4 Test import dengan role salah tulis: isi role "Anggota" (huruf besar A) → cek berhasil (normalisasi); isi role "member" → cek masuk errors
- [x] 6.5 Test import file bukan Excel: upload file .pdf atau .jpg → cek toast error muncul di frontend sebelum dikirim ke server
- [x] 6.6 Test password: login dengan akun yang baru diimport menggunakan password "password123" → login berhasil
