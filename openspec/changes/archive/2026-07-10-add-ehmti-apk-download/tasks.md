## 1. Verifikasi akses Drive (memblokir semua tugas lain)

- [x] 1.1 Tulis skrip sekali pakai di scratchpad yang memuat `.env` backend, lalu panggil `drive.files.get({ fileId: '1QwQcQFjTq2apFdyH0UjPwyS9GEcun9Ul', fields: 'id,name,size,mimeType' })` memakai kredensial OAuth yang sama dengan `GoogleDriveService`. Selesai bila skrip mencetak nama dan ukuran berkas.
      - **HASIL: GAGAL `404 File not found`.** Akun OAuth backend adalah `hmti@ubs.ac.id`. Probe lanjutan: tidak ada berkas `.apk` di mana pun yang terlihat oleh akun ini; ID yang diberikan tidak terlihat sebagai file maupun folder; `GOOGLE_DRIVE_PARENT_FOLDER_ID` kosong. APK berada di akun Drive lain dan belum dibagikan.
- [x] 1.2 Selidiki mengapa berkas tak terlihat, sebelum menyalahkan izin. Konfirmasi scope token lewat `oauth2.googleapis.com/tokeninfo`.
      - **HASIL: scope = `drive.file`** → akses per-berkas, hanya untuk berkas yang **dibuat aplikasi**. Fitur dokumen berjalan karena berkasnya diunggah backend sendiri; APK diunggah manusia, jadi tak terlihat. Berbagi berkas ke `hmti@ubs.ac.id` **tidak akan menolong**. Bukti tambahan: `GOOGLE_DRIVE_PARENT_FOLDER_ID` di `.env` pun dijawab `404`.
- [x] 1.3 Putuskan jalan keluar bersama pengguna. **Dipilih: setel APK ke "Anyone with the link" dan proxy lewat HTTPS anonim** — scope `drive.file` jadi tidak relevan, kredensial produksi tidak disentuh. `design.md` Keputusan 1 dibalik.
- [x] 1.4 **BUTUH TINDAKAN PENGGUNA**: setel `E-hmti.apk` → Share → General access → "Anyone with the link" (Viewer), lalu kirim tautannya. — selesai oleh pengguna.
- [x] 1.5 Dari tautan tersebut, ambil **file ID APK**. — file ID = `1ZSQOhnVhXkW0i5km0jfEK-bX6SHXDGiZ`. Verifikasi anonim: `200 OK`, `Content-Type: application/octet-stream`, `Content-Disposition: attachment; filename="E-hmti.apk"`, `Content-Length: 60053175` (**57,3 MB**).
      - **Konsekuensi: > ~50 MB → penyetelan Nginx (Tugas 5.6) WAJIB, bukan opsional.**

## 2. Endpoint unduhan backend

- [x] 2.1 Tambahkan `EHMTI_APK_FILE_ID=1ZSQOhnVhXkW0i5km0jfEK-bX6SHXDGiZ` ke `.env` lokal; `.env.example` diberi kunci kosong. Tidak ada default di kode.
- [x] 2.2 Tambahkan `GET app/apk` ke `DocumentsController`, tanpa `@UseGuards`, mengikuti pola `@Res()` dari rute `download/:id`. — terverifikasi: `Mapped {/documents/app/apk, GET} route`.
- [x] 2.3 Ambil APK lewat `fetch` anonim ke `https://drive.usercontent.google.com/download?id=<id>&export=download&confirm=t`. **Tanpa** `GoogleDriveService` — scope `drive.file` tidak berlaku untuk berkas ini.
- [x] 2.4 Pasang header respons: `Content-Type: application/vnd.android.package-archive`, `Content-Disposition: attachment; filename="E-HMTI.apk"`, dan `res.setTimeout(5 * 60 * 1000)`.
- [x] 2.5 Balas `503` + log peringatan bila `EHMTI_APK_FILE_ID` kosong. Balas `404` + pesan Indonesia ramah pengguna bila Drive membalas non-`200` **atau** `Content-Type` mengandung `text/html`. Jangan bocorkan file ID atau stack trace.
      - Terverifikasi keduanya. Env kosong → `503 {"error":"Unduhan aplikasi belum tersedia"}`. Diberi file ID privat → Drive balas `200 text/html` (layar login), endpoint balas `404` + log `Drive menolak APK: status=200 content-type=text/html`.
- [x] 2.6 Alirkan bodi respons ke klien; pasang handler galat yang menghancurkan (destroy) respons bila header sudah terkirim, alih-alih mengirim header galat kedua.
- [x] 2.7 Uji tanpa header `Authorization`. — terverifikasi rute publik. Env kosong → `503`; file ID privat → `404`; file ID nyata → `200` dengan `Content-Type: application/vnd.android.package-archive` dan `Content-Disposition: attachment; filename="E-HMTI.apk"`. Tak pernah `401`.
- [x] 2.8 Unduh penuh secara lokal lewat endpoint kita. — `200`, `size=60053175` (sama persis dengan Drive), 35 s @ ~1,7 MB/s. `file` → **Android package (APK), with gradle app-metadata.properties**; magic bytes `PK\x03\x04`. Bukan HTML.

## 3. Judul dokumen

- [x] 3.1 Ubah `<title>` di [hmti-frontend/index.html](hmti-frontend/index.html#L7) dari `Vite App` menjadi `HMTI UBS`.
- [x] 3.2 Cari `Vite App` di seluruh `hmti-frontend/` (kecuali `node_modules` dan `dist`) untuk memastikan tak ada sisa lain. — bersih, nol kecocokan.

## 4. Tombol Download E-HMTI

- [x] 4.1 Di [HomeView.vue](hmti-frontend/src/views/HomeView.vue#L465), tepat setelah `div` CTA yang ada, tambahkan `div` pembungkus baru: `hero-fade-up mt-4 flex justify-center` dengan `style="animation-delay:0.44s;"`.
- [x] 4.2 Render tombol sebagai `<a>` bergaya pill glass/tonal dengan atribut `download`, `:href` dibentuk dari `API_BASE_URL` + `/documents/app/apk`. Tanpa `target="_blank"`, tanpa `window.open`.
- [x] 4.3 Sisipkan ikon unduh (SVG inline, `w-4 h-4 shrink-0`) mengikuti gaya ikon WhatsApp pada tombol di sampingnya. Ditambah spinner saat keadaan sedang bekerja.
- [x] 4.4 Sediakan varian mode gelap dan terang lewat pola `isDarkMode ? … : …` seperti CTA yang lain.
- [x] 4.5 Tambahkan ref `isDownloadingApk`: `@click` menyalakannya, `setTimeout` 3 detik mematikannya; timer dibersihkan di `onUnmounted`. Selagi menyala, `pointer-events-none` mencegah klik ganda.
- [x] 4.6 Verifikasi desktop (Chrome headless, 1440×900). — tombol tampil di bawah baris CTA, terpusat, pill kaca jelas berbeda dari gradient & outline. `<a download>` tanpa `target="_blank"`, jadi tak ada tab baru.
- [x] 4.7 Verifikasi mobile (390×844). — tombol menumpuk rapi di bawah CTA, tak ada gulir horizontal.
      - Diukur lewat Chrome DevTools Protocol dengan `Emulation.setDeviceMetricsOverride({mobile:true})`: `documentElement.scrollWidth = 390 = clientWidth`. **Nol overflow.**
      - **Koreksi:** laporan awal saya soal "hero meluber di mobile" itu **keliru** — artefak `chrome --headless --window-size=390`, yang tidak menerapkan `meta viewport` sehingga halaman dirender sebagai desktop sempit lalu dipotong. Screenshot pembanding `git stash` memang identik, tapi keduanya sama-sama artefak. Tidak ada bug mobile. Selalu pakai emulasi CDP, bukan `--window-size`, untuk menilai layout mobile.
- [x] 4.8 Verifikasi tidak ada regresi: perbandingan screenshot sebelum/sesudah menunjukkan CTA lama tak bergeser; indikator gulir tidak tumpang tindih.
- [x] 4.9 Verifikasi kontras WCAG AA. — **`text-primary-blue-dark` GAGAL (3,86:1)**, di bawah ambang 4,5:1. Diganti `text-blue-800` → **6,84:1** (hover 6,42:1). Mode gelap `text-slate-100` → 13,11:1. Keduanya lolos AA.

## 5. Deploy ke VPS

- [x] 5.1 Minta kata sandi VPS kepada pengguna (tidak tersimpan; memori sengaja tidak memuat kredensial).
- [x] 5.2 Tambahkan `EHMTI_APK_FILE_ID` ke `.env` produksi. — di-*append* setelah `cp .env .env.bak.20260710`; 11 kunci lama utuh, kini 12.
- [x] 5.3 Build backend, unggah `dist` memakai pola tukar aman `dist_new`, `pm2 restart hmti-backend --update-env`. — PM2 id 0 online, restart #78.
- [x] 5.4 Uji asap di server. — `curl -sI localhost:3000/documents/app/apk` → `200`, `Content-Type: application/vnd.android.package-archive`, `Content-Disposition: attachment; filename="E-HMTI.apk"`, `Content-Length: 60053175`. Rute terdaftar di log PM2.
- [x] 5.5 Uji unduhan penuh dari luar VPS. — `https://hmti.my.id/api/documents/app/apk` → `200`, `size=60053175` (sama persis dengan Drive), TTFB `1,17 s`, total `61,7 s`. `file` → **Android package (APK)**. Tidak terpotong.
- [x] 5.6 Penyetelan Nginx — **tidak diperlukan, berdasarkan bukti.** `nginx -T` menunjukkan tak ada direktif `proxy_buffering` (default `on`), namun TTFB 1,17 s membuktikan respons sudah dialirkan, bukan disangga penuh dulu. `proxy_max_temp_file_size` default 1024 MB > 57,3 MB, jadi tak ada pemotongan. Mematikan buffering pada seluruh `location /api/` justru mencabut perlindungan backend dari klien lambat — tidak sepadan.
- [x] 5.7 Build frontend, verifikasi `<title>HMTI UBS</title>` di `dist/index.html`, unggah dengan pola tukar aman. — hash aset `index-BCgjYiED.js` / `index-D1F5oIJ8.css` cocok antara build lokal dan `dist_new` sebelum swap. `dist_old` disimpan.
- [x] 5.8 Verifikasi produksi. — `https://hmti.my.id/` melayani `<title>HMTI UBS</title>`, nol kecocokan `Vite App`. Screenshot Chrome headless menampilkan tombol `Download E-HMTI` di posisi benar. Unduhan APK utuh dari domain publik (lihat 5.5).
- [ ] 5.9 Verifikasi di Chrome Android sungguhan: unduhan berjalan, tak ada tab kosong, tak ada peringatan popup terblokir. — **butuh perangkat nyata; tak bisa dibuktikan headless.**
- [ ] 5.10 Bersihkan `dist_old` di kedua aplikasi. — **sengaja ditunda** sampai 5.9 lulus, supaya rollback satu perintah tetap tersedia.
