# Capability: Member Management

## Purpose

Mengelola tampilan, interaksi, dan aksi pada halaman Anggota, termasuk kontrol akses berbasis role untuk fitur-fitur manajemen data.
## Requirements
### Requirement: Tombol Download Template di halaman Anggota
Halaman Anggota SHALL menampilkan tombol "Download Template" yang hanya terlihat oleh pengguna dengan `canManageData === true`, yang ketika diklik men-trigger download file template Excel dari endpoint `GET /members/import-template`.

#### Scenario: Tombol terlihat oleh pengurus
- **WHEN** pengguna login sebagai ketum, sekretaris, atau bendahara dan membuka halaman Anggota
- **THEN** tombol "Download Template" terlihat di area aksi cepat (berdekatan dengan tombol Import Excel)

#### Scenario: Tombol tidak terlihat oleh anggota biasa
- **WHEN** pengguna login sebagai role anggota
- **THEN** tombol "Download Template" tidak ditampilkan

#### Scenario: Klik Download Template memulai download
- **WHEN** pengguna mengklik tombol "Download Template"
- **THEN** browser mendownload file "Template-Import-Anggota.xlsx" secara otomatis

### Requirement: Tombol Import Excel dan modal import di halaman Anggota
Halaman Anggota SHALL menampilkan tombol "Import Excel" yang ketika diklik membuka modal dua langkah: (1) pilih file + pratinjau jumlah baris, (2) hasil import setelah proses selesai.

#### Scenario: Tombol Import Excel hanya untuk yang bisa manage data
- **WHEN** pengguna dengan `canManageData === true` membuka halaman Anggota
- **THEN** tombol "Import Excel" terlihat di area aksi cepat

#### Scenario: Modal langkah 1 — pilih file dan pratinjau
- **WHEN** pengguna mengklik "Import Excel"
- **THEN** modal terbuka dengan input file, tombol "Proses Import", dan tombol "Batal"; setelah file dipilih, modal menampilkan nama file yang dipilih

#### Scenario: Modal langkah 2 — hasil import ditampilkan
- **WHEN** proses import selesai (API mengembalikan respons)
- **THEN** modal menampilkan: jumlah anggota berhasil ditambahkan, jumlah dilewati, dan daftar baris error beserta keterangannya

#### Scenario: Setelah import berhasil, daftar anggota di-refresh
- **WHEN** import selesai dan ada minimal 1 anggota yang berhasil diimport
- **THEN** `fetchMembers()` dipanggil otomatis sehingga tabel anggota menampilkan data terbaru

### Requirement: Modal tambah/edit anggota berada di lapisan paling atas

Modal tambah anggota dan edit anggota SHALL dirender pada lapisan (z-index) paling atas, di atas banner notifikasi tagihan bulanan dan elemen lainnya.

#### Scenario: Modal terbuka saat banner notifikasi tampil

- **WHEN** banner notifikasi tagihan bulanan sedang tampil dan pengguna membuka modal tambah atau edit anggota
- **THEN** modal beserta overlay-nya tampil sepenuhnya di atas banner, tidak ada bagian modal yang tertimpa banner

### Requirement: Modal tambah/edit anggota responsif dan dapat ditutup di mobile

Modal tambah/edit anggota SHALL dapat di-scroll penuh hingga tombol submit terjangkau di mobile, dan SHALL menyediakan cara yang jelas untuk menutupnya di mobile.

#### Scenario: Modal lebih tinggi dari layar mobile

- **WHEN** pengguna membuka modal tambah/edit anggota pada layar mobile dan isi form lebih tinggi dari viewport
- **THEN** pengguna dapat men-scroll isi modal hingga bawah dan menekan tombol submit

#### Scenario: Menutup modal anggota di mobile

- **WHEN** modal tambah/edit anggota terbuka di mobile
- **THEN** tersedia kontrol yang jelas untuk menutup modal (mis. tombol tutup dan/atau tap area luar) tanpa harus menyelesaikan form

### Requirement: Tabel anggota responsif di mobile

Tabel anggota SHALL menyesuaikan tampilannya untuk pengguna mobile sehingga data dan aksi tetap dapat diakses tanpa kehilangan informasi penting.

#### Scenario: Tabel anggota pada layar sempit

- **WHEN** tabel anggota ditampilkan pada viewport mobile
- **THEN** data anggota dan aksi baris tetap dapat diakses dan disesuaikan (melalui penyesuaian kolom, layout kartu, atau scroll horizontal yang jelas)

### Requirement: Editing an existing member updates only whitelisted fields

Updating a member SHALL succeed and SHALL only accept editable fields (`npm`, `name`, `angkatan`, `jabatan`, `role`, `status`, and optionally `email`, `phone`, `bio`). The client SHALL NOT send server-managed or sensitive fields (`password`, `joinedAt`, `avatarUrl`, `avatarDriveFileId`, relations) in the update payload. The backend update endpoint SHALL validate and whitelist the request body via a dedicated DTO instead of accepting an untyped `any` body, rejecting unknown fields rather than passing them to the database layer.

#### Scenario: Admin edits a member successfully
- **WHEN** an authorized admin opens the edit modal for an existing member, changes fields, and saves
- **THEN** the request contains only editable fields and the member record is updated without a server error, and the updated data is shown in the table

#### Scenario: Server-managed fields are not accepted
- **WHEN** an update request includes a non-editable field such as `password` or `joinedAt`
- **THEN** the backend rejects or strips the disallowed field and does not corrupt the stored record

#### Scenario: Update endpoint uses a validated DTO
- **WHEN** the `PATCH /members/:id` endpoint receives a body
- **THEN** the body is validated against an `UpdateMemberDto` with whitelisting enabled, and invalid payloads return a 400 rather than a database error

### Requirement: Daftar anggota tidak pernah membocorkan kredensial

`GET /members` SHALL mengembalikan hanya kolom yang dibutuhkan tampilan. Respons MUST TIDAK PERNAH memuat kolom `password`, baik teks polos maupun hash.

Rute ini tetap dapat diakses tanpa autentikasi karena halaman muka publik memakainya untuk menampilkan pengurus. Yang dibatasi adalah **isi payload**, bukan aksesnya.

#### Scenario: Kolom password dipangkas

- **WHEN** klien mana pun memanggil `GET /members`
- **THEN** setiap objek anggota dalam respons TIDAK memuat kunci `password`
- **AND** respons tetap memuat `nia`, `name`, `role`, `status`, `phone`, dan `avatarUrl`

#### Scenario: Pengunjung anonim tetap dilayani

- **WHEN** klien tanpa header `Authorization` memanggil `GET /members`
- **THEN** sistem membalas `200` dengan daftar anggota
- **AND** sistem TIDAK membalas `401`

#### Scenario: Halaman publik tidak rusak

- **WHEN** `HomeView` dan `LoginView` memuat daftar anggota untuk menampilkan pengurus dan mencari nomor Ketua Umum
- **THEN** keduanya berfungsi seperti semula memakai payload yang sudah dipangkas

### Requirement: Pembuatan anggota menuntut otorisasi

`POST /members` SHALL menolak permintaan tanpa token JWT yang sah. Rute ini MUST dijaga guard autentikasi dan peran, sejajar dengan rute administratif lain pada controller yang sama.

#### Scenario: Permintaan anonim ditolak

- **WHEN** klien tanpa header `Authorization` memanggil `POST /members` dengan body apa pun
- **THEN** sistem membalas `401 Unauthorized`
- **AND** tidak ada baris baru yang ditulis ke tabel `Member`

#### Scenario: Anggota biasa ditolak

- **WHEN** pengguna terautentikasi tanpa peran pengurus memanggil `POST /members`
- **THEN** sistem membalas `403 Forbidden`

#### Scenario: Pengurus diizinkan membuat akun dengan peran

- **WHEN** pengguna terautentikasi dengan peran pengurus memanggil `POST /members` dengan payload sah, termasuk `role`
- **THEN** anggota baru dibuat dengan `role` tersebut dan sistem membalas `201`
- **AND** respons TIDAK memuat kolom `password`
- **AND** anggota baru memakai password default dari skema (alur generate akun tidak berubah)

### Requirement: Body pembuatan anggota divalidasi lewat DTO

Body `POST /members` SHALL divalidasi lewat DTO ber-whitelist. Field yang dikirim UI admin (`nia, npm, name, angkatan, jabatan, role, status, email, phone, bio`) MUST diizinkan; field server-managed (`password, joinedAt, avatarUrl, avatarDriveFileId`) MUST TIDAK dapat ditentukan lewat body. Field asing MUST ditolak, bukan diteruskan mentah ke Prisma.

Catatan: `role` sengaja diizinkan — admin yang berwenang menentukannya saat generate akun. Pengaman terhadap eskalasi hak akses adalah **guard** pada rute (lihat requirement sebelumnya), bukan pemblokiran `role`.

#### Scenario: Password tidak dapat ditimpa lewat body

- **WHEN** permintaan sah dari pengurus memuat `"password": "sesuatu"`
- **THEN** field itu dibuang; anggota baru tetap memakai password default skema

#### Scenario: Field asing ditolak

- **WHEN** permintaan memuat field yang tidak ada dalam DTO
- **THEN** sistem membalas `400`, bukan `500`, dan field itu tidak pernah sampai ke `prisma.member.create()`

