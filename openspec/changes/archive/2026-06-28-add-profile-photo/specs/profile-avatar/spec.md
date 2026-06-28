## ADDED Requirements

### Requirement: Anggota dapat mengupload foto profil
Sistem SHALL menyediakan endpoint `PATCH /members/me/avatar` yang menerima file gambar (JPEG, PNG, atau WebP, maks 2MB) melalui multipart/form-data dengan field name `avatar`. Endpoint hanya dapat diakses oleh pengguna yang telah terautentikasi (JWT). File disimpan di server dan URL-nya disimpan di field `avatarUrl` pada record `Member` yang sesuai. Jika anggota sudah memiliki foto sebelumnya, file lama dihapus dari server.

#### Scenario: Upload foto profil berhasil
- **WHEN** pengguna terautentikasi mengirim request `PATCH /members/me/avatar` dengan file gambar JPEG/PNG/WebP berukuran ≤ 2MB
- **THEN** sistem menyimpan file di `uploads/avatars/` dengan nama unik berbasis NIA dan timestamp, memperbarui field `avatarUrl` pada Member di database, dan mengembalikan response 200 dengan objek `{ avatarUrl: "<url-publik>" }`

#### Scenario: Upload ditolak karena tipe file tidak valid
- **WHEN** pengguna mengirim request dengan file selain JPEG, PNG, atau WebP (misalnya PDF atau GIF)
- **THEN** sistem mengembalikan response 400 Bad Request dengan pesan error yang menjelaskan bahwa hanya tipe gambar yang diizinkan

#### Scenario: Upload ditolak karena ukuran file melebihi batas
- **WHEN** pengguna mengirim request dengan file gambar berukuran > 2MB
- **THEN** sistem mengembalikan response 413 (Payload Too Large) atau 400 dengan pesan error tentang batas ukuran file

#### Scenario: Upload tanpa autentikasi ditolak
- **WHEN** request `PATCH /members/me/avatar` dikirim tanpa JWT token yang valid
- **THEN** sistem mengembalikan response 401 Unauthorized

### Requirement: Foto profil tersedia sebagai URL publik yang dapat diakses
Sistem SHALL melayani file foto profil yang telah diupload melalui URL statis `GET /uploads/avatars/<filename>` tanpa memerlukan autentikasi, sehingga browser frontend dapat menampilkan foto.

#### Scenario: Akses file foto yang ada
- **WHEN** browser melakukan request GET ke `/uploads/avatars/<filename>` dengan nama file yang valid
- **THEN** server mengembalikan file gambar dengan content-type yang sesuai (image/jpeg, image/png, dll.)

#### Scenario: Akses file yang tidak ada mengembalikan 404
- **WHEN** browser melakukan request GET ke `/uploads/avatars/<nama-tidak-ada>`
- **THEN** server mengembalikan response 404

### Requirement: Halaman profil menampilkan foto profil anggota
Frontend SHALL menampilkan foto profil anggota di bagian atas halaman `Profile.vue`. Jika `avatarUrl` tidak null, tampilkan gambar dari URL tersebut. Jika `avatarUrl` null atau kosong, tampilkan avatar fallback berupa inisial nama anggota dalam lingkaran berwarna.

#### Scenario: Anggota memiliki foto profil
- **WHEN** halaman profil dimuat dan data anggota memiliki `avatarUrl` yang tidak null
- **THEN** komponen menampilkan gambar dari `avatarUrl` dalam format lingkaran (border-radius: 50%) dengan ukuran yang sesuai

#### Scenario: Anggota belum memiliki foto profil
- **WHEN** halaman profil dimuat dan `avatarUrl` anggota adalah null atau string kosong
- **THEN** komponen menampilkan lingkaran dengan inisial nama anggota (misalnya "MH" untuk "Muhammad Hariyanto") sebagai fallback visual

### Requirement: Pengguna dapat mengganti foto profil melalui UI
Halaman profil SHALL menyediakan tombol atau area interaktif yang memungkinkan pengguna memilih file gambar dari perangkat mereka dan menguploadnya ke endpoint `/members/me/avatar`. Setelah upload berhasil, foto yang baru langsung tampil tanpa perlu refresh halaman.

#### Scenario: Pengguna memilih dan mengupload foto baru
- **WHEN** pengguna mengklik tombol/area upload foto, memilih file gambar yang valid, dan konfirmasi
- **THEN** frontend mengirim request multipart ke `PATCH /members/me/avatar`, menampilkan indikator loading selama proses, dan setelah berhasil memperbarui tampilan avatar secara reaktif dengan foto baru

#### Scenario: Proses upload gagal ditampilkan ke pengguna
- **WHEN** upload foto gagal (tipe tidak valid, ukuran melebihi batas, atau error server)
- **THEN** frontend menampilkan pesan error yang informatif kepada pengguna tanpa mengganti avatar yang ada sebelumnya
