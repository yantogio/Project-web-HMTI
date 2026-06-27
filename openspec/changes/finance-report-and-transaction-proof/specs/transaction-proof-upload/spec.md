## ADDED Requirements

### Requirement: Field bukti transaksi pada model Transaction
Model `Transaction` SHALL memiliki tiga field baru yang bersifat optional:
- `proofUrl String?` — URL publik Google Drive untuk akses bukti
- `proofDriveFileId String?` — ID file di Google Drive untuk keperluan pengelolaan
- `paymentMethod String?` — Metode pembayaran kas anggota: `cash` atau `non-cash`

#### Scenario: Transaksi lama tetap valid
- **WHEN** migrasi database dijalankan untuk menambah field baru
- **THEN** semua transaksi yang sudah ada tetap valid dengan field baru bernilai `null`

### Requirement: Upload bukti transaksi pada form input pemasukan — tab Kas Anggota
Form input pemasukan tab "Kas Anggota" SHALL menampilkan pilihan metode pembayaran `Cash` dan `Non-Cash`. Jika `Cash` dipilih, tidak ada upload bukti yang diperlukan. Jika `Non-Cash` dipilih, field upload bukti transaksi SHALL muncul dan wajib diisi sebelum submit. Field keterangan/deskripsi SHALL secara otomatis ditambahkan suffix `[Cash]` atau `[Non-Cash]` saat submit.

#### Scenario: Pilih Cash — tidak perlu upload
- **WHEN** bendahara memilih metode `Cash` pada form kas anggota
- **THEN** field upload bukti tidak ditampilkan dan form dapat disubmit tanpa file

#### Scenario: Pilih Non-Cash — upload wajib
- **WHEN** bendahara memilih metode `Non-Cash` namun tidak mengupload file
- **THEN** form tidak dapat disubmit dan menampilkan pesan error "Bukti transaksi wajib untuk pembayaran non-cash"

#### Scenario: Pilih Non-Cash — upload berhasil
- **WHEN** bendahara memilih `Non-Cash`, mengupload file bukti, dan submit
- **THEN** file terupload ke Google Drive folder "Bukti Transaksi", `proofUrl` tersimpan di transaksi, dan `paymentMethod` tersimpan sebagai `non-cash`

#### Scenario: Deskripsi otomatis terisi metode pembayaran
- **WHEN** bendahara submit form kas anggota dengan keterangan "Iuran Mei" dan metode "Non-Cash"
- **THEN** field `description` yang tersimpan di database adalah "Iuran Mei [Non-Cash]"

### Requirement: Upload bukti transaksi pada form input pemasukan — tab Dana Eksternal
Form input pemasukan tab "Dana Eksternal" SHALL selalu menampilkan field upload bukti transaksi yang bersifat wajib. Tidak ada pilihan cash/non-cash pada tab ini.

#### Scenario: Submit dana eksternal tanpa bukti
- **WHEN** bendahara mencoba submit form dana eksternal tanpa mengupload file
- **THEN** form tidak dapat disubmit dan menampilkan pesan error "Bukti transaksi wajib untuk dana eksternal"

#### Scenario: Submit dana eksternal dengan bukti
- **WHEN** bendahara mengupload file dan submit form dana eksternal
- **THEN** file terupload ke Google Drive dan `proofUrl` tersimpan di transaksi

### Requirement: Upload bukti transaksi pada form input pengeluaran
Form input pengeluaran SHALL selalu menampilkan field upload bukti transaksi yang bersifat wajib.

#### Scenario: Submit pengeluaran tanpa bukti
- **WHEN** bendahara mencoba submit form pengeluaran tanpa mengupload file
- **THEN** form tidak dapat disubmit dan menampilkan pesan error "Bukti transaksi wajib untuk pengeluaran"

#### Scenario: Submit pengeluaran dengan bukti
- **WHEN** bendahara mengupload file dan submit form pengeluaran
- **THEN** file terupload ke Google Drive folder "Bukti Transaksi" dan `proofUrl` tersimpan di transaksi

### Requirement: File bukti disimpan ke Google Drive folder Bukti Transaksi
Backend SHALL mengupload file bukti ke folder Google Drive dengan ID `1nf_Pk_aOgqt_uy6iQiSn5hmQyhH90Dis` menggunakan `GoogleDriveService.uploadFile()` dengan `targetFolderId` yang sesuai. Upload dilakukan **sebelum** menyimpan data transaksi ke database.

#### Scenario: Upload gagal mencegah transaksi tersimpan
- **WHEN** upload ke Google Drive gagal (misal: timeout, error autentikasi)
- **THEN** transaksi tidak tersimpan ke database dan backend merespons dengan HTTP 500 beserta pesan error yang informatif

#### Scenario: File terupload bersifat publik
- **WHEN** file berhasil diupload ke Google Drive
- **THEN** file diberi permission `reader` untuk `anyone` sehingga link dapat dibuka tanpa login Google
