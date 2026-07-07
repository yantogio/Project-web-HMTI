# Panduan Deploy HMTI ke VPS

Arsitektur produksi: **satu origin**. Nginx melayani frontend statis di port 80 dan
memproksi `/api/` ke backend NestJS di `127.0.0.1:3000`. Browser tidak pernah
memanggil port 3000 langsung, sehingga CORS tidak diperlukan dan port 3000 bisa
ditutup dari publik.

```
Browser ──▶ :80 Nginx ──┬─ /      → file statis hasil `vite build` (dist/)
                        └─ /api/  → proxy ke 127.0.0.1:3000 (prefix /api dilepas)
```

## 1. Build frontend (di laptop / CI — JANGAN di VPS 1 GB)

```bash
cd hmti-frontend
npm run build        # hasil di dist/, otomatis pakai base URL '/api'
```

Tidak perlu mengatur `VITE_API_BASE_URL` untuk produksi — default `/api` sudah benar.
(`.env.development` hanya dipakai `npm run dev` agar tetap menunjuk `http://localhost:3000`.)

Pastikan bundle bersih: `grep -r "localhost:3000" dist/` harus tanpa hasil.

## 2. Konfigurasi Nginx di VPS

Tambahkan di server block (mis. `/etc/nginx/sites-available/hmti`):

```nginx
server {
    listen 80;
    server_name _;   # ganti dengan domain bila sudah ada

    # Frontend statis
    root /var/www/hmti/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;   # SPA fallback untuk vue-router
    }

    # API — trailing slash pada proxy_pass MELEPAS prefix /api,
    # jadi route backend tidak perlu diubah (/api/members → /members)
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 10M;   # batas upload (Excel import, bukti transaksi)
}
```

Terapkan:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 3. `.env` backend di VPS

```
NODE_ENV=production
DATABASE_URL="file:/path/absolut/ke/prod.db"   # di LUAR folder repo
JWT_SECRET=<secret baru yang panjang, jangan pakai punya development>
# CORS_ORIGINS tidak diperlukan lagi (same-origin via Nginx).
# Isi hanya jika ada klien lain yang memanggil API lintas origin.
```

Jalankan dengan PM2:

```bash
pm2 start dist/main.js --name hmti-api --max-memory-restart 600M
pm2 save
```

## 4. Smoke test (WAJIB sebelum menutup port 3000)

```bash
curl -i http://<IP-VPS>/api/members     # harus 200 + JSON anggota
curl -i http://<IP-VPS>/               # harus 200 + HTML
```

Lalu buka situs di browser dan pastikan data home/anggota termuat.

## 5. Tutup port 3000 dari publik

```bash
sudo ufw deny 3000
sudo ufw status
```

Verifikasi ulang situs masih berfungsi (Nginx tetap bisa akses 127.0.0.1:3000).

## Rollback

Kembalikan `dist/` lama dan hapus block `location /api/`, lalu reload Nginx.
Jika perlu jalur darurat lama (browser → :3000 langsung): buka kembali port 3000
dan set `CORS_ORIGINS=http://<IP-VPS>` di `.env` backend, lalu `pm2 restart hmti-api`.

## Catatan diagnosa

- Penolakan CORS kini dicatat di log backend sebagai `[CORS] Origin ditolak: <origin>`
  dan TIDAK lagi menghasilkan 500 — cek `pm2 logs hmti-api` bila ada keluhan akses.
- Backend sudah mengatur `trust proxy`, jadi rate limiting tetap akurat per-IP
  di belakang Nginx.
