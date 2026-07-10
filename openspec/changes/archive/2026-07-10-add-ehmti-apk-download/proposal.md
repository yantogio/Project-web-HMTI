## Why

Aplikasi mobile **E-HMTI** (`E-hmti.apk`) sudah tersedia di Google Drive HMTI (folder `E-HMTI`), tetapi belum ada jalur bagi mahasiswa untuk mengunduhnya dari website. Saat ini APK hanya bisa didapat lewat pembagian link manual, sehingga distribusi tidak terukur dan tidak terpusat.

Selain itu, judul jendela browser masih memakai nilai bawaan scaffold Vite (`Vite App`). Ini terlihat tidak profesional di tab browser, bookmark, riwayat, dan hasil share link — dan langsung terbaca oleh siapa pun yang membuka `hmti.my.id`.

## What Changes

- **Judul dokumen** di `hmti-frontend/index.html` diubah dari `Vite App` menjadi `HMTI UBS`.
- **Tombol baru "Download E-HMTI"** ditambahkan pada bagian hero `HomeView.vue`, diposisikan **di bawah** baris tombol `Gabung Sekarang` + `Hubungi Ketua Umum`, rata tengah, dengan gaya visual berbeda dari keduanya (varian ketiga: bukan gradient solid, bukan outline biru — lihat `design.md`).
- **Endpoint publik baru di backend** yang men-*stream* APK dari Google Drive dan memaksa unduhan langsung (`Content-Disposition: attachment`), memakai kembali `GoogleDriveService.getFileStream()` yang sudah ada.
  - Alasan: file Drive `1QwQcQFjTq2apFdyH0UjPwyS9GEcun9Ul` **terverifikasi belum publik** — permintaan anonim ke `drive.usercontent.google.com/download?id=…` me-redirect ke halaman login Google (HTTP 302 → `accounts.google.com`). Menautkan link Drive langsung dari tombol akan menghasilkan halaman login, bukan unduhan.
  - Proxy backend juga menghilangkan halaman antara "Google can't scan this file for viruses" dan menjamin nama berkas serta MIME type yang benar (`application/vnd.android.package-archive`).
- **Perilaku unduhan dijaga konsisten** di desktop dan mobile: navigasi ke URL unduhan dilakukan tanpa `target="_blank"` yang menyisakan tab kosong, tanpa memicu blokir popup, dan tanpa mengganggu layout hero yang sudah ada (`flex-col sm:flex-row`).

Tidak ada perubahan yang bersifat **BREAKING**. Endpoint baru tidak mengubah kontrak endpoint lama.

## Capabilities

### New Capabilities

- `app-distribution`: Distribusi APK aplikasi mobile E-HMTI melalui website — endpoint unduhan publik yang mem-proxy berkas dari Google Drive, beserta entry point tombol unduh di halaman utama. Mencakup perilaku unduhan, penanganan galat (Drive tidak tersedia / berkas tidak ditemukan), dan kesetaraan perilaku desktop vs mobile.
- `site-branding`: Identitas dokumen situs — judul jendela/tab browser dan metadata dasar yang tampil pada tab, bookmark, dan pratinjau tautan.

### Modified Capabilities

Tidak ada. Perubahan ini tidak mengubah requirement spec yang sudah ada. `docs-view` juga memakai Google Drive, tetapi perilakunya (pratinjau dokumen) tidak berubah — hanya `GoogleDriveService` yang dipakai bersama, dan itu detail implementasi, bukan requirement.

## Impact

**Kode terdampak**

- `hmti-frontend/index.html` — elemen `<title>`.
- `hmti-frontend/src/views/HomeView.vue` — blok CTA hero (sekitar baris 445–465): pembungkus tombol baru + handler unduhan.
- `hmti-backend/src/documents/documents.controller.ts` — endpoint publik baru (mis. `GET /documents/app/apk`), rute tanpa `JwtAuthGuard`, mengikuti pola `download/:id` yang sudah ada (baris 129–161).
- `hmti-backend/src/documents/google-drive.service.ts` — dipakai ulang tanpa modifikasi; `getFileStream()` sudah menangani retry, rate limit, dan galat 403/404.

**Konfigurasi**

- File ID APK (`1QwQcQFjTq2apFdyH0UjPwyS9GEcun9Ul`) diperlakukan sebagai konfigurasi, bukan konstanta hardcoded — lewat env var (mis. `EHMTI_APK_FILE_ID`) agar APK bisa diperbarui tanpa build ulang.
- Bergantung pada kredensial Drive yang sudah ada di produksi: `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN`. **Perlu diverifikasi** bahwa akun OAuth tersebut punya akses baca ke folder `E-HMTI`; jika tidak, endpoint akan mengembalikan galat 403 dari Drive.

**Sistem / operasional**

- Nginx di VPS harus meneruskan respons besar tanpa buffering penuh ke disk dan tanpa timeout dini (APK berukuran puluhan MB) — kemungkinan perlu penyesuaian `proxy_max_temp_file_size` / `proxy_read_timeout` pada blok `/api`.
- Deploy ke VPS `163.61.58.127` (path `/var/www/Project-web-HMTI`): butuh build ulang **frontend dan backend**, lalu `pm2 restart hmti-backend`.
- Bandwidth VPS kini menanggung transfer APK yang sebelumnya ditanggung Google. Untuk skala HMTI ini dapat diterima; jika trafik melonjak, alternatifnya adalah menjadikan berkas Drive publik dan melakukan redirect (dibahas di `design.md`).

**Non-goals**

- Tidak membuat halaman khusus unduhan, changelog versi, atau penghitung unduhan.
- Tidak menyediakan tautan App Store / Play Store.
- Tidak mengunggah APK ke repositori atau ke VPS sebagai berkas statis.
