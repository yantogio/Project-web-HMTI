## 1. Audit singkat (data dummy — tanpa backup/rotasi)

- [x] 1.1 Cari pemanggil `POST /members`. — hanya `Anggota.vue:203` (`http.post('/members', newMember.value)`), memakai `http` ber-JWT. Payload: `nia, npm, name, angkatan, jabatan, role, status`. Tidak mengirim `password` → default skema `password123` yang mengisi. Guard aman untuk pemanggil ini.
- [x] 1.2 Konfirmasi alur generate akun bergantung pada `@default("password123")` di `schema.prisma:19`, bukan pada body. — benar. Perbaikan tidak boleh menyentuh ini.
- Backup DB & rotasi password **tidak dilakukan**: data seluruhnya dummy, akan direset dari nol setelah sidang.

## 2. Hentikan kebocoran

- [x] 2.1 `MembersService.findAll()` memakai konstanta `MEMBER_PUBLIC_SELECT` (cermin `findOne()`, tanpa `password`/`avatarDriveFileId`). Dipakai ulang oleh `create()` juga, agar tidak drift.
- [x] 2.2 Respons memuat `role, status, name, avatarUrl, phone, joinedAt, email, bio` — mencukupi keempat pemanggil (`HomeView`, `LoginView`, `Anggota`, `FinanceView`), yang tak satu pun membaca `password`.
- [x] 2.3 `curl localhost:3000/members | grep -c '"password"'` → **0**.
- [x] 2.4 `GET /members` tanpa `Authorization` → **200**, 20 anggota, field lengkap. Bukan `401`.

## 3. Tutup pembuatan anggota

- [x] 3.1 `@Post()` kini `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ketum','sekretaris','bendahara')`, sama dengan rute admin lain.
- [x] 3.2 `CreateMemberDto` dibuat (whitelist: `nia, npm, name, angkatan, jabatan, role` wajib; `status, email, phone, bio` opsional). `password/joinedAt/avatar*` sengaja absen. `create()` memakai DTO ini.
- [x] 3.3 Respons `POST` memakai `MEMBER_PUBLIC_SELECT` — terverifikasi tanpa `password`.
- [x] 3.4 `POST` tanpa token → **401** (bukan `500`).
- [x] 3.5 `POST` dengan token anggota biasa (`role: anggota`) → **403**.
- [x] 3.6 `POST` pengurus + field asing (`password`, `evil`) → **400** (`property ... should not exist`), tak sentuh Prisma. Payload sah + `role` → **201**, respons tanpa password, dan akun baru bisa login dengan `password123` (default skema berlaku → alur generate akun utuh).
- [x] 3.7 Alur create sah menghasilkan `201` dengan payload persis yang dikirim `Anggota.vue` (`nia, npm, name, angkatan, jabatan, role, status`); UI admin memakai `http` ber-JWT sehingga guard tidak menghalanginya. Data uji dibersihkan (`UJI-SEC` dihapus, `UJI-INJ` tak pernah tercipta).

## 4. Deploy dan verifikasi produksi

- [x] 4.1 Password VPS dipakai dari sesi ini (tidak disimpan).
- [x] 4.2 Build backend, unggah dengan pola tukar aman, `pm2 restart hmti-backend --update-env`. — restart #79 online; `dist_old` disimpan untuk rollback.
- [x] 4.3 `curl https://hmti.my.id/api/members | grep -c '"password"'` → **0**.
- [x] 4.4 `POST https://hmti.my.id/api/members -d '{}'` anonim → **401** (bukan `500`).
- [x] 4.5 Render `/login` di Chrome (CDP): halaman utuh, tombol "Hubungi Ketua Umum" terisi → `LoginView` berhasil membaca ketum dari `/members` yang dipangkas. `GET /members` produksi tetap `200`, 25 anggota, `role/phone/avatarUrl` ada. Tak ada regresi.
- [x] 4.6 Login ketum produksi → **201**. Alur login tidak disentuh, hanya dikonfirmasi.

## 5. Tindak lanjut (di luar cakupan change ini)

- [ ] 5.1 Setelah reset DB pasca-sidang, pastikan sistem produksi yang baru sudah membawa perbaikan ini sejak awal (akun bendahara Anda satu-satunya yang tersisa).
- [ ] 5.2 Pertimbangkan change terpisah untuk hashing bcrypt + menghapus fallback teks polos di `auth.service.ts:37`. **Catatan penting:** ini akan mengubah cara password disimpan/dibandingkan, jadi harus dicek dulu apakah bertentangan dengan desain yang tertulis di skripsi sebelum dikerjakan.
