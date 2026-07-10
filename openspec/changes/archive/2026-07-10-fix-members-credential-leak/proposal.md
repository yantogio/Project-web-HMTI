## Why

`GET https://hmti.my.id/api/members` terbuka tanpa autentikasi dan mengembalikan **seluruh kolom** tabel `Member`, termasuk `password` dalam **teks polos**. Satu perintah `curl` dari siapa pun, di mana pun, menghasilkan **25 anggota** lengkap dengan NIA, email, nomor telepon, dan **7 password unik** — salah satunya milik akun ber-`role: "ketum"`. Penyerang dapat langsung masuk sebagai Ketua Umum.

Pada rute yang sama, `POST /api/members` juga **tanpa guard**, dan `create(data: any)` meneruskan body permintaan mentah ke `prisma.member.create()` tanpa whitelist DTO. Siapa pun dapat mendaftarkan akun baru dengan `role: "ketum"` untuk dirinya sendiri. Terverifikasi di produksi: `POST /api/members` dengan body `{}` membalas `500` (Prisma menolak field kurang), **bukan** `401` — artinya permintaan mencapai handler.

Dua lubang ini berdiri sendiri: yang pertama membocorkan kredensial, yang kedua memberi eskalasi hak akses tanpa perlu kredensial apa pun. Keduanya aktif di produksi saat dokumen ini ditulis.

Ini bukan akibat perubahan `add-ehmti-apk-download`; kondisinya sudah ada sebelumnya. Ditemukan saat memverifikasi bahwa deploy APK tidak merusak apa pun.

## What Changes

- **`GET /members` berhenti mengembalikan kolom `password`.** `MembersService.findAll()` memakai `select` Prisma eksplisit, bukan `findMany()` polos. Rute tetap publik karena `HomeView` (halaman muka, pengunjung anonim) memakainya untuk menampilkan pengurus.
- **`POST /members` dijaga.** Ditambahkan `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`, sejajar dengan rute admin lain di controller yang sama.
- **`POST /members` memvalidasi input.** Body dipetakan lewat `CreateMemberDto` ber-whitelist yang **mengizinkan** field sah yang dikirim UI admin (`nia, npm, name, angkatan, jabatan, role, status, email, phone, bio`) dan menolak field server-managed (`password, joinedAt, avatarUrl, avatarDriveFileId`). `role` tetap boleh dikirim admin — itu bagian desain. DTO ini juga memperbaiki `500` menjadi `400` untuk body kurang lengkap.
- **Tidak ada rotasi password.** Data saat ini seluruhnya dummy dan akan direset dari nol setelah sidang skripsi (menyisakan satu akun bendahara). Merotasi password dummy sia-sia; yang penting perbaikan kodenya, agar sistem aman sejak reset berikutnya.
- **Tidak** mengubah cara password disimpan (masih teks polos, `@default("password123")`), alur login, alur generate akun, maupun mekanisme password default. Batasan tegas dari pemilik: cara login dan cara pengguna memakainya harus persis seperti yang tertulis di skripsi. Perbaikan ini hanya menyentuh serialisasi respons dan guard rute.

## Capabilities

### New Capabilities

Tidak ada.

### Modified Capabilities

- `member-management`: `GET /members` MUST TIDAK PERNAH mengembalikan kolom `password`. `POST /members` MUST menuntut autentikasi dan peran pengurus. (Admin yang berwenang tetap boleh menentukan `role` — itu bagian desain generate akun.)
- `backend-security-hardening`: menambahkan requirement bahwa setiap rute yang mengembalikan entitas `Member` wajib memakai `select` eksplisit, dan setiap rute yang menulis `Member` wajib dijaga guard.

## Impact

**Kode terdampak**

- [members.service.ts:20-22](hmti-backend/src/members/members.service.ts#L20-L22) — `findAll()` memakai `prisma.member.findMany()` polos. Ini sumber kebocoran.
- [members.service.ts:15-18](hmti-backend/src/members/members.service.ts#L15-L18) — `create(data: any)` meneruskan body mentah ke Prisma.
- [members.controller.ts:66](hmti-backend/src/members/members.controller.ts#L66) — `@Post()` tanpa `@UseGuards`.
- [members.controller.ts:70](hmti-backend/src/members/members.controller.ts#L70) — `@Get()` tanpa `@UseGuards` (dipertahankan publik, tetapi payload-nya dipangkas).
- `findOne()` di baris 58 **sudah aman** — ia memakai `select` tanpa `password`. Dipakai sebagai pola acuan.

**Pemanggil `/members` di frontend** (empat, tak satu pun butuh `password`):

- [HomeView.vue:235](hmti-frontend/src/views/HomeView.vue#L235) — daftar pengurus, halaman publik.
- [LoginView.vue:146](hmti-frontend/src/views/LoginView.vue#L146) — mencari nomor WhatsApp Ketua Umum. Halaman publik, pra-login.
- [Anggota.vue:130](hmti-frontend/src/views/Anggota.vue#L130) — tabel anggota.
- [FinanceView.vue:457](hmti-frontend/src/views/FinanceView.vue#L457) — pemetaan anggota untuk transaksi.

Karena tak satu pun membaca `password`, memangkas kolom itu **tidak merusak** keempatnya. Guard pada `POST` juga aman: satu-satunya pemanggilnya adalah alur admin yang sudah membawa token.

**Operasional**

- Deploy backend ke VPS `163.61.58.127` (`npm run build` → tukar `dist` → `pm2 restart hmti-backend`). Tidak ada perubahan frontend.
- Rotasi password menyentuh basis data produksi `hmti-backend/prisma/dev.db`. Wajib backup lebih dulu; anggota harus diberi tahu password barunya.

**Non-goals**

- Tidak melakukan hashing password dengan bcrypt, tidak menghapus fallback perbandingan teks polos di [auth.service.ts:37](hmti-backend/src/auth/auth.service.ts#L37). Itu memerlukan migrasi data dan pengujian alur login tersendiri; kebocoran harus ditutup lebih dulu, bukan menunggu pekerjaan besar itu selesai.
- Tidak mengaudit rute lain di luar `/members`.
- Tidak mengubah `GET /members` menjadi rute terproteksi — itu akan merusak halaman muka publik.
