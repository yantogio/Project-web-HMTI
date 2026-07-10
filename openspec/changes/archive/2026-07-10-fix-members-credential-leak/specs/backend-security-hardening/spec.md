## ADDED Requirements

### Requirement: Entitas Member selalu diserialisasi lewat select eksplisit

Setiap query Prisma yang hasilnya dikembalikan ke klien SHALL memakai klausa `select` eksplisit. Query `findMany()` atau `findUnique()` tanpa `select` MUST TIDAK dipakai pada model `Member`, karena setiap kolom baru pada skema akan otomatis ikut terkirim ke klien.

Ini melindungi dari kelas galat, bukan satu galat: `password` bocor persis karena `findAll()` memanggil `prisma.member.findMany()` polos.

#### Scenario: Kolom sensitif tidak pernah lolos

- **WHEN** kode mengembalikan satu atau banyak entitas `Member` ke klien
- **THEN** query yang menghasilkannya memakai `select` yang menyebutkan setiap kolom secara eksplisit
- **AND** `password` tidak termasuk di dalamnya

#### Scenario: Kolom baru aman secara bawaan

- **WHEN** kolom sensitif baru ditambahkan ke model `Member` di `schema.prisma`
- **THEN** kolom itu tidak muncul di respons API mana pun tanpa seseorang menambahkannya secara sadar ke `select`

### Requirement: Rute yang menulis data dijaga guard

Setiap rute yang membuat, mengubah, atau menghapus entitas SHALL memakai `@UseGuards(JwtAuthGuard, ...)`. Rute tulis tanpa guard MUST diperlakukan sebagai cacat keamanan.

#### Scenario: Rute tulis tanpa guard ditolak saat tinjauan

- **WHEN** sebuah handler `@Post`, `@Patch`, `@Put`, atau `@Delete` tidak memiliki dekorator guard
- **THEN** itu dianggap cacat yang harus diperbaiki sebelum rilis

#### Scenario: Permintaan tulis anonim ditolak

- **WHEN** klien tanpa autentikasi memanggil rute tulis mana pun
- **THEN** sistem membalas `401` sebelum handler dijalankan
- **AND** sistem TIDAK membalas `500`, karena `500` menandakan permintaan sudah mencapai handler
