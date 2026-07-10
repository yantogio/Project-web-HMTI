## Context

Website HMTI adalah frontend Vue 3 (Vite + Tailwind + Pinia) dan backend NestJS/Prisma, dilayani Nginx + PM2 di VPS `163.61.58.127` pada path `/var/www/Project-web-HMTI`.

Backend sudah memiliki `GoogleDriveService` ([google-drive.service.ts](hmti-backend/src/documents/google-drive.service.ts)) yang terautentikasi lewat OAuth refresh token dan mengekspos `getFileStream(fileId)` dengan retry, backoff eksponensial saat rate-limit `429`, serta penanganan `403`/`404`. `DocumentsController` sudah memakainya pada rute `GET /documents/download/:id` ([documents.controller.ts:129](hmti-backend/src/documents/documents.controller.ts#L129)) — rute itu **tidak** dilindungi guard, sehingga pola endpoint publik yang mengalirkan berkas Drive sudah ada preseden di kode.

### Temuan yang mengubah desain (Tugas 1)

Verifikasi Tugas 1 menggugurkan asumsi awal. Dua fakta terukur:

**1. `1QwQcQFjTq2apFdyH0UjPwyS9GEcun9Ul` adalah ID *folder* `E-HMTI`, bukan ID berkas APK.** File ID `E-hmti.apk` masih harus ditentukan.

**2. Scope OAuth backend adalah `https://www.googleapis.com/auth/drive.file`** — dikonfirmasi lewat endpoint `tokeninfo`. Scope ini memberi *akses per-berkas hanya untuk berkas yang dibuat oleh aplikasi itu sendiri*, bukan akses ke seluruh Drive akun `hmti@ubs.ac.id`.

Ini menjelaskan mengapa fitur dokumen/foto/video berjalan sempurna sementara APK tak terlihat: berkas-berkas itu **diunggah oleh backend** lewat `uploadFile()`, jadi aplikasi adalah pembuatnya. APK diunggah manusia lewat UI Drive, jadi bagi aplikasi ia tidak ada. Bukti pendukung:

```
files.get(APK folder id)                → 404 File not found
files.get(GOOGLE_DRIVE_PARENT_FOLDER_ID) → 404 File not found   ← folder di .env sendiri!
drives.list()                            → insufficient authentication scopes
files.list(q="name contains '.apk'")     → (none)
files.list(q="sharedWithMe = true")      → (none)
```

Folder induk yang tertulis di `.env` pun `404` karena ia juga dibuat manusia. Berkas hasil unggahan aplikasi ternyata hidup di parent `1OKDPkGBWw3Qs-4hhAOZ0soiOS1nzpEnq` dengan `owner = hmti@ubs.ac.id`.

**Konsekuensi:** membagikan folder ke `hmti@ubs.ac.id` **tidak menolong** — di bawah `drive.file`, berbagi tidak membuat berkas terlihat oleh aplikasi. Kredensial OAuth yang ada tidak dapat dipakai untuk membaca APK ini.

Bagian hero `HomeView.vue` memuat dua CTA di dalam `div.hero-fade-up` dengan `flex flex-col sm:flex-row justify-center gap-3 md:gap-4` ([HomeView.vue:446](hmti-frontend/src/views/HomeView.vue#L446)) — menumpuk pada mobile, sebaris pada `sm` ke atas. Di bawahnya ada indikator gulir dengan `mt-16`. Animasi masuk dipentaskan lewat `animation-delay` inline (`0.12s`, `0.24s`, `0.36s`, `0.5s`).

## Goals / Non-Goals

**Goals:**

- Klik tunggal pada halaman utama menghasilkan berkas `E-HMTI.apk` yang tersimpan di perangkat pengguna, tanpa layar antara dari Google.
- Berfungsi untuk pengunjung anonim, di desktop maupun mobile, tanpa terhalang pemblokir popup.
- APK dapat diperbarui dengan mengganti berkas di Drive — tanpa build ulang atau redeploy.
- Tidak ada regresi visual pada CTA hero yang sudah ada.
- Judul dokumen mencerminkan merek situs.

**Non-Goals:**

- Versioning, changelog, atau penghitung unduhan.
- Menyimpan APK di dalam repo atau sebagai aset statis di VPS.
- Deteksi platform (menyembunyikan tombol untuk pengguna iOS).
- Menautkan ke Play Store.

## Decisions

### Keputusan 1: Proxy backend memakai HTTPS anonim, bukan kredensial OAuth

Endpoint baru `GET /documents/app/apk` mengambil APK dari `https://drive.usercontent.google.com/download?id=<id>&export=download&confirm=t` memakai `fetch` biasa **tanpa autentikasi**, lalu mengalirkan bodinya ke klien dengan header `Content-Type: application/vnd.android.package-archive` dan `Content-Disposition: attachment; filename="E-HMTI.apk"`.

Prasyaratnya: berkas APK disetel **"Anyone with the link" (Viewer)** di Drive. Ini dipilih pengguna secara sadar — APK memang ditujukan untuk diunduh publik, jadi tidak ada kerugian kerahasiaan yang nyata.

Karena permintaan bersifat anonim, batas scope `drive.file` menjadi **tidak relevan**: kita tidak lagi lewat Drive API. `GoogleDriveService` tetap tak tersentuh dan tetap melayani fitur dokumen seperti sebelumnya.

**Mengapa bukan alternatif lain:**

| Alternatif | Mengapa ditolak |
|---|---|
| `GoogleDriveService.getFileStream()` (rencana awal) | Mustahil di bawah scope `drive.file` — aplikasi hanya melihat berkas buatannya sendiri. Berbagi berkas pun tak menolong. |
| `<a href>` langsung ke URL Drive publik | Drive menyisipkan halaman antara "can't scan for viruses" untuk berkas besar, memaksa pengguna mengeklik dua kali. Nama berkas yang tersaji juga di luar kendali kita. Selain itu file ID Drive terekspos di HTML. |
| Perluas scope OAuth ke `drive.readonly`, terbitkan ulang refresh token | Paling "benar" secara arsitektur dan APK boleh tetap privat — tetapi menyentuh kredensial produksi yang sedang menopang fitur unggah/pratinjau dokumen. Salah langkah = fitur dokumen mati. Biaya risikonya tidak sebanding untuk satu tombol unduh. |
| Menyalin APK ke VPS sebagai berkas statis | Paling cepat dilayani, tetapi APK jadi artefak deploy — setiap rilis butuh unggah manual ke server. Bertentangan dengan sasaran "perbarui lewat Drive saja". |

Proxy tetap memberi kendali penuh atas header, menyembunyikan file ID Drive dari HTML, dan melewati halaman antara virus-scan.

**Konsekuensi:** bandwidth transfer APK berpindah ke VPS. Untuk skala HMTI ini dapat diterima. Endpoint kini bergantung pada setelan berbagi Drive: bila seseorang mematikan "anyone with link", tombol rusak. Ini ketergantungan operasional yang nyata — endpoint MUST membedakan galat itu (Drive membalas HTML login, bukan biner) dan membalas `404`, bukan mengalirkan halaman HTML sebagai APK.

### Keputusan 2: File ID lewat environment variable

`EHMTI_APK_FILE_ID` dibaca dari `process.env`. Bila kosong, endpoint membalas `503` dan mencatat log alih-alih gagal saat proses boot — endpoint unduhan yang mati tidak boleh menjatuhkan seluruh API.

Catatan: ID `1QwQcQFjTq2apFdyH0UjPwyS9GEcun9Ul` dari proposal adalah **ID folder**, jadi ia bukan nilai yang benar untuk variabel ini. Nilainya harus ID berkas `E-hmti.apk` itu sendiri. Tidak ada nilai default yang ditanam di kode — default yang salah lebih buruk daripada tidak ada default, karena ia gagal secara diam-diam.

**Alternatif:** menanam ID sebagai konstanta. Ditolak karena setiap penggantian APK menuntut build + deploy ulang backend.

### Keputusan 3: Deteksi respons non-biner dari Drive

Sebelum mengalirkan bodi respons, endpoint memeriksa `Content-Type` yang dikembalikan Drive. Bila mengandung `text/html`, itu berarti Drive menyajikan layar login atau halaman peringatan — bukan APK. Endpoint MUST membalas `404` dan mencatat log, alih-alih meneruskan HTML ke pengguna dengan header APK (yang akan menghasilkan berkas `E-HMTI.apk` rusak berisi HTML).

Ini bukan kehati-hatian teoretis: itu persis yang dikembalikan Drive hari ini untuk berkas privat, terverifikasi lewat `curl`.

### Keputusan 4: Pemicuan unduhan lewat elemen `<a download>`, bukan `window.open`

Tombol dirender sebagai `<a>` yang bergaya seperti tombol, `:href` menunjuk URL unduhan absolut, dengan atribut `download`. Tanpa `target="_blank"`.

**Mengapa:** `window.open()` bisa diblokir pemblokir popup, dan di Chrome Android meninggalkan tab kosong menganga saat unduhan berjalan. Navigasi biasa ke respons `Content-Disposition: attachment` tidak pernah memindahkan halaman — peramban mengalihkannya ke pengelola unduhan sementara halaman utama tetap diam. Ini memenuhi requirement "tanpa blokir popup" dan "tanpa tab kosong" sekaligus, tanpa satu baris JavaScript pun.

URL dibentuk dari `API_BASE_URL` ([http.js:6](hmti-frontend/src/api/http.js#L6)) supaya konsisten antara dev (`localhost:3000`) dan produksi (`/api`).

Keadaan loading murni kosmetik — tak ada cara andal mengetahui kapan unduhan yang dikendalikan peramban selesai. Handler `@click` menyalakan flag dan mematikannya lewat timer pendek (~3 detik). Ini memberi umpan balik dan meredam klik ganda; ia tidak mengklaim tahu unduhan sudah beres.

### Keputusan 5: Tombol sebagai baris ketiga, varian visual ketiga

CTA yang ada tetap utuh di dalam `div` masing-masing. Sebuah `div` baru diletakkan tepat sesudahnya dengan `mt-4 flex justify-center` dan `hero-fade-up` `animation-delay: 0.44s` — di antara CTA (`0.36s`) dan indikator gulir (`0.5s`), sehingga menyatu ke dalam koreografi masuk yang sudah ada.

Perbendaharaan visual hero saat ini: **gradient terisi** (Gabung Sekarang) dan **outline** (Hubungi Ketua Umum). Varian ketiga adalah **pill bergaya kaca (glass/tonal)**: latar semi-transparan, cincin halus, ikon unduh — jelas berbeda tanpa bersaing memperebutkan perhatian dengan CTA utama.

```
        ┌──────────────────┐  ┌────────────────────────┐
        │ 🚀 Gabung Sekarang│  │ ⌾ Hubungi Ketua Umum  │   ← baris CTA yang ada
        └──────────────────┘  └────────────────────────┘

              ╭────────────────────────────╮
              │  ⭳  Download E-HMTI        │              ← baru, terpusat, glass
              ╰────────────────────────────╯
```

Menaruhnya di dalam flex container yang sudah ada ditolak: pada `sm`+ ia akan ikut sebaris jadi tombol ketiga, bukan berada di bawah dan terpusat sebagaimana diminta.

## Risks / Trade-offs

- **Setelan berbagi Drive dimatikan** ("anyone with link" dicabut) → Drive menyajikan HTML login, endpoint membalas `404`, tombol rusak. Ini ketergantungan operasional yang tak terlihat dari kode. Mitigasi: Keputusan 3 memastikan kegagalannya keras dan jelas (`404` + log), bukan APK rusak berisi HTML. Uji asap Tugas 5 memverifikasi ukuran unduhan, bukan sekadar kode status.
- ~~Akun OAuth backend mungkin tak punya akses baca~~ → **terjadi, dan sudah diselesaikan** dengan membalik Keputusan 1 ke HTTPS anonim. Lihat "Temuan yang mengubah desain".
- **Nginx menyangga (buffer) respons besar ke disk**, memperlambat time-to-first-byte atau menabrak batas ukuran berkas sementara → setel `proxy_buffering off` (atau naikkan `proxy_max_temp_file_size`) dan `proxy_read_timeout 300s` pada lokasi `/api`. Uji dengan `curl -o /dev/null -w '%{size_download}'` dari luar VPS dan bandingkan dengan ukuran APK sebenarnya.
- **Bandwidth VPS** kini menanggung setiap unduhan. Satu APK 50 MB × 300 mahasiswa ≈ 15 GB. Mitigasi: pantau; jalur mundur ke redirect tersedia tanpa mengubah frontend.
- **Peramban mobile boleh mengabaikan atribut `download`** untuk respons lintas asal. Header `Content-Disposition` dari server tetap memaksa perilaku unduhan, jadi header itulah mekanisme sesungguhnya — atribut `download` hanya sabuk pengaman kedua.
- **`E-hmti.apk` di Drive diganti dengan berkas rusak/salah** → tombol menyajikan berkas rusak dengan patuh. Di luar cakupan; distribusi APK di sini bergantung pada disiplin siapa pun yang mengelola folder Drive.
- **Peringatan "sumber tidak dikenal" Android** akan muncul saat pemasangan. Diharapkan untuk distribusi di luar Play Store; tak ada mitigasi teknis.

## Migration Plan

1. Verifikasi akses Drive dari lingkungan backend (skrip sekali pakai; tanpa perubahan kode).
2. Tambahkan `EHMTI_APK_FILE_ID` ke `.env` produksi di VPS.
3. Terapkan perubahan backend → `npm run build` → unggah `dist` → `pm2 restart hmti-backend` (id PM2 `0`).
4. Uji asap (smoke test) endpoint langsung di server sebelum menyentuh frontend: `curl -sI localhost:3000/documents/app/apk`.
5. Sesuaikan Nginx bila uji asap dari luar VPS mengembalikan hasil terpotong atau lambat; `nginx -t && systemctl reload nginx`.
6. Terapkan perubahan frontend (`index.html` + `HomeView.vue`) → `npm run build` → unggah `dist` memakai pola tukar yang aman: `mkdir dist_new` → `pscp -r dist host:.../dist_new/` → `mv dist dist_old && mv dist_new/dist dist`.
7. Verifikasi di produksi: judul tab tertulis `HMTI UBS`; tombol muncul; unduhan berjalan di Chrome desktop dan Chrome Android.

**Rollback:** frontend — `mv dist dist_old2 && mv dist_old dist` (tanpa build ulang). Backend — endpoint bersifat aditif; bila bermasalah, kembalikan `dist` lama dan `pm2 restart`. Basis data SQLite berada di luar `dist`, jadi kedua pemulihan tersebut aman terhadap data.

## Open Questions

- ~~Apakah akun OAuth Drive backend punya akses baca?~~ **Terjawab: tidak, dan tak bisa dibuat bisa** tanpa mengganti scope. Desain dibalik ke HTTPS anonim.
- **Berapa file ID `E-hmti.apk`?** ID di proposal adalah ID folder. **Memblokir Tugas 2.5.** Menunggu tautan berbagi dari pengguna.
- Berapa ukuran sebenarnya `E-hmti.apk`? Menentukan apakah penyetelan Nginx (langkah 5) wajib atau opsional. Diketahui dari header `Content-Length` begitu berkas jadi publik.
- Apakah tombol perlu disembunyikan bagi pengunjung iOS? Diasumsikan **tidak** — dinyatakan sebagai non-goal; tombol muncul untuk semua orang.
