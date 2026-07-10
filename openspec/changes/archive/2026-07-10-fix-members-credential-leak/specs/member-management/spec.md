## ADDED Requirements

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
