# Tutorial Deploy Detail — Langkah demi Langkah

Tutorial ini melanjutkan perbaikan kode yang sudah selesai (frontend sekarang
memanggil `/api`, bukan `localhost:3000`). Ikuti berurutan dari atas.

**Aturan penting: perhatikan setiap perintah dijalankan DI MANA.**

| Simbol | Artinya |
|--------|---------|
| 💻 LAPTOP | Jalankan di laptop Windows kamu (PowerShell / Git Bash) |
| 🖥️ VPS | Jalankan di VPS (setelah `ssh` masuk) |

---

## LANGKAH 1 — Build frontend di laptop 💻

Buka terminal di folder project, lalu:

```bash
cd "c:\PROJECT WEB HMTI\hmti-frontend"
npm run build
```

Tunggu sampai muncul `✓ built in ...s`. Hasilnya ada di folder
`hmti-frontend\dist\` — folder inilah yang akan di-upload ke VPS.

> Kenapa di laptop? VPS kamu cuma punya RAM 1 GB — proses build bisa bikin
> VPS kehabisan memori. Build selalu di laptop, VPS hanya menerima hasilnya.

---

## LANGKAH 2 — Masuk ke VPS dan cari tahu posisi file kamu 🖥️

```bash
ssh root@163.61.58.127
```

(ganti `root` dengan username kamu kalau bukan root)

Sekarang cari tahu 2 hal — **catat hasilnya**, dipakai di langkah berikutnya:

**a. Di mana folder frontend yang sekarang dilayani Nginx?**

```bash
grep -r "root " /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null
```

Outputnya seperti: `root /var/www/hmti/dist;` → berarti folder frontend kamu
di `/var/www/hmti/dist`. Kita sebut ini `FOLDER_FRONTEND`.

**b. Di mana folder backend berjalan?**

```bash
pm2 list          # lihat nama proses backend kamu
pm2 info <nama-proses> | grep "exec cwd"
```

Baris `exec cwd` menunjukkan folder backend. Kita sebut ini `FOLDER_BACKEND`.

---

## LANGKAH 3 — Edit konfigurasi Nginx 🖥️

**a. Cari file konfignya:**

```bash
ls /etc/nginx/sites-enabled/
```

Biasanya ada file bernama `default` atau nama situs kamu. Buka dengan nano:

```bash
sudo nano /etc/nginx/sites-enabled/default
```

**b. Di dalam blok `server { ... }` yang sudah ada**, pastikan isinya seperti
ini (sesuaikan `root` dengan `FOLDER_FRONTEND` dari Langkah 2a):

```nginx
server {
    listen 80;
    server_name _;

    root /var/www/hmti/dist;      # ← FOLDER_FRONTEND kamu
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # ▼▼▼ BLOK BARU — INI KUNCINYA ▼▼▼
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    # ▲▲▲ sampai sini ▲▲▲

    client_max_body_size 10M;
}
```

> ⚠️ PENTING: `proxy_pass http://127.0.0.1:3000/;` — **garis miring `/` di
> akhir wajib ada**. Itulah yang membuang awalan `/api` sebelum diteruskan ke
> backend (`/api/members` → `/members`). Tanpa slash itu, semua request API
> akan 404.

Simpan di nano: tekan `Ctrl+O`, Enter, lalu `Ctrl+X`.

**c. Tes dan terapkan:**

```bash
sudo nginx -t
```

Harus muncul `syntax is ok` dan `test is successful`. Kalau error, baca pesan
errornya — biasanya salah ketik atau kurung kurawal tidak seimbang. Lalu:

```bash
sudo systemctl reload nginx
```

**d. Tes langsung dari dalam VPS:**

```bash
curl -i http://localhost/api/members
```

✅ Berhasil kalau: muncul `HTTP/1.1 200 OK` lalu data JSON anggota.
❌ Kalau `404` → cek slash di `proxy_pass`. Kalau `502` → backend mati,
jalankan `pm2 list` dan `pm2 restart <nama-proses>`.

---

## LANGKAH 4 — Upload dist/ baru dari laptop 💻

**Buka terminal BARU di laptop** (jangan tutup SSH), lalu:

```bash
cd "c:\PROJECT WEB HMTI\hmti-frontend"
scp -r dist/* root@163.61.58.127:/var/www/hmti/dist/
```

Sesuaikan `root@` dan `/var/www/hmti/dist` dengan hasil Langkah 2a.

> Alternatif kalau `scp` terasa ribet: pakai **WinSCP** (aplikasi gratis) —
> login ke VPS, lalu drag-and-drop isi folder `dist` dari laptop ke
> `FOLDER_FRONTEND` di VPS, timpa semua file lama.

---

## LANGKAH 5 — Tes dari browser 💻

1. Buka `http://163.61.58.127` di browser.
2. Tekan `Ctrl+Shift+R` (hard refresh, membuang cache file lama).
3. Buka DevTools (`F12`) → tab **Network**.
4. Refresh halaman. Perhatikan request-nya:
   - ✅ Benar: request menuju `http://163.61.58.127/api/members` dengan
     status **200**, dan data pengurus/showcase muncul di halaman.
   - ❌ Masih menuju `...163.61.58.127:3000/...` → yang ter-upload masih
     build lama. Ulangi Langkah 1 dan 4, lalu hard refresh lagi.
5. Coba login dan buka halaman Anggota / Keuangan — semua harus termuat.

---

## LANGKAH 6 — Tutup port 3000 dari publik 🖥️

**Hanya lakukan setelah Langkah 5 sukses semua.**

```bash
sudo ufw status
```

- Kalau statusnya `inactive`, aktifkan dulu — **JANGAN lupa izinkan SSH
  sebelum enable**, kalau tidak kamu terkunci di luar VPS:

  ```bash
  sudo ufw allow OpenSSH
  sudo ufw allow 80
  sudo ufw allow 443
  sudo ufw enable
  ```

- Lalu tutup port 3000:

  ```bash
  sudo ufw deny 3000
  ```

**Verifikasi terakhir:**

```bash
curl -i http://localhost/api/members    # 🖥️ dari VPS: harus tetap 200
```

Dan dari browser laptop: situs harus tetap normal, tapi
`http://163.61.58.127:3000/members` harus **tidak bisa diakses lagi** —
itu tandanya backend kamu sekarang aman di belakang Nginx.

---

## Kalau Ada Masalah (Troubleshooting)

| Gejala | Penyebab paling umum | Solusi |
|--------|---------------------|--------|
| `/api/members` → 404 | Slash akhir hilang di `proxy_pass` | Pastikan `proxy_pass http://127.0.0.1:3000/;` |
| `/api/members` → 502 Bad Gateway | Backend mati | `pm2 list`, lalu `pm2 restart <nama>`; cek `pm2 logs` |
| Halaman putih setelah upload | Cache browser / upload tidak lengkap | `Ctrl+Shift+R`; pastikan `index.html` ikut ter-upload |
| Refresh di halaman selain home → 404 | `try_files` belum ada | Tambahkan `try_files $uri $uri/ /index.html;` di `location /` |
| Data kosong tapi tidak ada error | Masih build lama yang panggil `:3000` | Cek tab Network; ulangi build + upload |
| Terkunci dari SSH setelah ufw enable | Lupa `ufw allow OpenSSH` | Pakai console/VNC dari panel penyedia VPS untuk masuk dan perbaiki |

Untuk melihat log backend kapan saja: `pm2 logs --lines 50` 🖥️
Penolakan CORS tercatat sebagai `[CORS] Origin ditolak: ...` (bukan error 500 lagi).
