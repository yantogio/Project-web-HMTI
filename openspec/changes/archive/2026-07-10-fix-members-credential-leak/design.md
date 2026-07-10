## Context

Ditemukan pada 2026-07-10 saat memverifikasi bahwa deploy `add-ehmti-apk-download` tidak merusak fitur lain. `GET /api/members` membalas `200` tanpa token — kecurigaan itu ditelusuri dan berujung pada dua lubang.

**Bukti terukur, diambil dari produksi:**

```
$ curl -s https://hmti.my.id/api/members | head -c 200
[{"nia":"test123", ... ,"role":"ketum", ... ,"password":"password123", ...
$ curl -s https://hmti.my.id/api/members | grep -o '"nia":' | wc -l      → 25
$ curl -s https://hmti.my.id/api/members | grep -o '"password":"[^"]*"' | sort -u | wc -l → 7

$ curl -s -X POST https://hmti.my.id/api/members -d '{}' -H 'Content-Type: application/json'
{"statusCode":500,"message":"Internal server error"}     ← 500, bukan 401
```

`500` pada `POST` itu penting: Prisma menolak field yang kurang. Artinya permintaan **melewati guard** dan mencapai handler. Bila rute dijaga, jawabannya `401`.

Akar masalahnya kecil dan spesifik:

| Lokasi | Isi | Akibat |
|---|---|---|
| `members.service.ts:21` | `prisma.member.findMany()` tanpa `select` | Semua kolom terkirim, termasuk `password` |
| `members.controller.ts:70` | `@Get()` tanpa guard | Kebocoran itu terbuka untuk publik |
| `members.controller.ts:66` | `@Post()` tanpa guard | Siapa pun dapat membuat anggota |
| `members.service.ts:15-18` | `create(data: any)` → `prisma.member.create({ data })` | `role` dapat disuntikkan dari body |

Sebaliknya, `findOne()` di baris 58 **sudah benar**: ia memakai `select` eksplisit dengan komentar `// Jangan kirim password ke frontend`. Jadi pola yang benar sudah hidup di berkas yang sama — `findAll()` hanya tidak mengikutinya. Ini bukan kesalahan desain, melainkan satu baris yang terlewat.

Password disimpan sebagai teks polos: `schema.prisma:19` → `password String @default("password123")`, dan `auth.service.ts:37` masih punya fallback `password === user.password`. Ini masalah nyata, tetapi terpisah.

## Goals / Non-Goals

**Goals:**

- Hentikan kebocoran `password` lewat `GET /members`, tanpa merusak halaman muka publik.
- Tutup `POST /members` dari pihak tak berwenang, dan cegah `role` disuntikkan.
- Rotasi seluruh password yang sudah terekspos.
- Tetapkan requirement yang mencegah kelas galat ini terulang, bukan sekadar menambal instansnya.

**Non-Goals:**

- Hashing password / menghapus fallback teks polos di `auth.service.ts`. Butuh migrasi data dan pengujian login tersendiri.
- Audit menyeluruh rute lain di luar `/members`.
- Menjadikan `GET /members` terproteksi.

## Decisions

### Keputusan 1: Pangkas payload, jangan tutup rutenya

`GET /members` tetap publik; `findAll()` memakai `select` eksplisit yang mencerminkan `findOne()`.

**Alternatif: pasang `JwtAuthGuard` pada `GET /members`.** Ditolak. Dua pemanggilnya adalah halaman **publik pra-login** — `HomeView` (daftar pengurus) dan `LoginView` (mencari nomor WhatsApp Ketua Umum). Menjaga rute itu akan mematikan keduanya bagi pengunjung anonim. Yang perlu dirahasiakan adalah `password`, bukan nama pengurus.

Audit keempat pemanggil (`HomeView`, `LoginView`, `Anggota`, `FinanceView`) menunjukkan **tak satu pun membaca `password`**. Jadi pemangkasan ini tidak merusak apa pun.

### Keputusan 2: `select` eksplisit, bukan `omit` atau interceptor

Prisma mendukung `omit: { password: true }`, dan Nest punya `ClassSerializerInterceptor` + `@Exclude()`.

**`select` dipilih** karena ia *allowlist*: kolom sensitif baru pada skema tidak akan pernah lolos tanpa seseorang menambahkannya secara sadar. `omit` adalah *denylist* — kolom baru bocor secara bawaan. Untuk cacat yang lahir persis dari "semua kolom ikut terkirim", allowlist adalah jawabannya.

`ClassSerializerInterceptor` ditolak karena menuntut entity class dan dekorator di seluruh lapisan; ia menyembunyikan kolom di tepi respons, bukan berhenti mengambilnya dari basis data.

### Keputusan 3: Guard `POST` memakai peran yang sama dengan `PATCH`/`DELETE` yang sudah ada

Controller ini sudah memakai `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)` pada rute admin lain (baris 129, 137). `POST` mengikuti pola itu persis. Tidak ada mekanisme baru yang diperkenalkan.

### Keputusan 4: Rotasi password adalah bagian dari perbaikan, bukan tindak lanjut

Menutup endpoint tidak menarik kembali data yang sudah keluar. Ketujuh password itu dapat diambil siapa pun, mungkin selama berbulan-bulan. Endpoint yang sudah ditambal dengan password lama yang masih berlaku tetap dapat ditembus.

Rotasi karena itu masuk ke `tasks.md`, bukan ke daftar "lain kali". Ia dijalankan **setelah** perbaikan ter-deploy — merotasi lebih dulu hanya akan membocorkan password baru lewat endpoint yang sama.

## Risks / Trade-offs

- **Password masih teks polos setelah change ini.** Rotasi menghasilkan password baru yang juga teks polos di basis data. Siapa pun yang memegang akses baca ke `dev.db` atau backup-nya tetap melihat semuanya. Mitigasi: change lanjutan untuk hashing bcrypt. Perbaikan ini menutup akses **jarak jauh tanpa autentikasi**; ia tidak menyelesaikan penyimpanan.
- **Rotasi mengunci anggota keluar** sampai mereka diberi tahu password barunya → siapkan jalur komunikasi lebih dulu; pertimbangkan merotasi akun pengurus (`ketum`, `bendahara`, `sekretaris`) terlebih dahulu, karena merekalah yang punya hak tulis.
- **Menulis ke `dev.db` produksi** → backup `prisma/dev.db` sebelum rotasi. Basis data berada di luar `dist`, jadi swap `dist` tidak menyentuhnya; skrip rotasi menyentuhnya.
- **Guard pada `POST /members` mungkin merusak pemanggil yang tak teraudit** (mis. skrip impor Excel). Mitigasi: cari pemanggil `POST /members` di seluruh frontend sebelum deploy; alur impor massal memakai endpoint terpisah dan sudah dijaga.
- **`500` pada `POST` anonim membocorkan keberadaan handler.** Setelah guard terpasang, jawabannya `401` — sekaligus memperbaiki kebocoran informasi kecil ini.

## Migration Plan

1. Backup `prisma/dev.db` produksi dan `.env`.
2. Terapkan perbaikan kode (`select` pada `findAll`, guard + DTO pada `create`).
3. Uji lokal: `GET /members` tanpa `password`; `POST /members` anonim → `401`.
4. Build backend → tukar `dist` → `pm2 restart hmti-backend`.
5. Verifikasi produksi: `curl https://hmti.my.id/api/members | grep -c password` → `0`; `POST` anonim → `401`.
6. Verifikasi halaman muka publik dan `LoginView` masih memuat data pengurus.
7. **Baru setelah itu**, rotasi password — pengurus lebih dulu.

**Rollback:** perubahan hanya menyentuh dua berkas dan bersifat aditif pada guard; kembalikan `dist` lama dan `pm2 restart`. `dev.db` tak tersentuh oleh langkah 2–6. Langkah 7 tidak dapat dibatalkan tanpa backup dari langkah 1.

## Open Questions

- Siapa yang memberi tahu 25 anggota tentang password baru mereka, dan lewat kanal apa? **Memblokir Tugas 4.**
- Apakah ada klien lain (skrip, Postman, alat dosen) yang memakai `POST /members` tanpa token? Bila ada, ia akan mulai gagal.
- Berapa lama endpoint ini terbuka? Menentukan apakah insiden ini perlu diumumkan ke anggota, bukan sekadar ditambal diam-diam. Riwayat git `members.controller.ts` dapat memberi batas bawah.
