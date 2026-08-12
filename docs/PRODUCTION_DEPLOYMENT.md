# HMTI Production Deployment Guide

This guide is for deploying the HMTI backend on a VPS behind Nginx with TLS, PM2, baseline server hardening, and cron backups.

Replace these placeholders before running commands:

- `api.example.com`: production API domain
- `frontend.example.com`: production frontend domain
- `YOUR_PUBLIC_SSH_KEY`: deploy user's public SSH key
- `/var/www/hmti`: application directory on the VPS

Do not commit real `.env` values. Rotate any secret that has ever been shared in chat, screenshots, or a repository.

## 1. Production Environment

Create `/var/www/hmti/hmti-backend/.env` on the VPS with production-only values:

```bash
NODE_ENV=production
PORT=3000
CORS_ORIGINS=https://frontend.example.com,https://www.frontend.example.com

DATABASE_URL=file:/var/www/hmti/hmti-backend/prisma/prod.db
JWT_SECRET=replace-with-a-long-random-secret

GOOGLE_DRIVE_CLIENT_ID=replace-me
GOOGLE_DRIVE_CLIENT_SECRET=replace-me
GOOGLE_DRIVE_REFRESH_TOKEN=replace-me
GOOGLE_DRIVE_PARENT_FOLDER_ID=replace-me
FOLDER_ID_AVATARS=replace-me
FOLDER_ID_SURAT=replace-me
FOLDER_ID_MEDIA=replace-me
FOLDER_ID_BRANDING=replace-me

FRONTEND_URL=https://frontend.example.com
API_URL=https://api.example.com
UPLOADS_DIR=/var/www/hmti/uploads
```

Generate secrets on your local machine:

```bash
openssl rand -base64 48
```

## 2. VPS Baseline

Run these commands as `root` on a fresh Ubuntu VPS.

```bash
apt update
apt upgrade -y
adduser deploy
usermod -aG sudo deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
printf '%s\n' 'YOUR_PUBLIC_SSH_KEY' > /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
```

Harden SSH after confirming a second terminal can log in as `deploy`:

```bash
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
sed -i 's/^#\?PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PubkeyAuthentication .*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sshd -t
systemctl reload ssh
```

Enable firewall and fail2ban:

```bash
apt install -y ufw fail2ban
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
systemctl enable --now fail2ban
fail2ban-client status sshd
```

Create 2 GB swap:

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
printf '\n/swapfile none swap sw 0 0\n' >> /etc/fstab
swapon --show
```

## 3. Runtime Setup

Install Node.js LTS, Nginx, Certbot, and PM2:

```bash
apt install -y ca-certificates curl git nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm install -g pm2
node --version
npm --version
pm2 --version
```

Deploy the project:

```bash
mkdir -p /var/www/hmti
chown -R deploy:deploy /var/www/hmti
sudo -iu deploy
cd /var/www/hmti
git clone <your-repository-url> .
cd hmti-backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
```

## 4. PM2

Copy `deploy/ecosystem.config.cjs` into `/var/www/hmti/deploy/ecosystem.config.cjs`, then start the backend:

```bash
cd /var/www/hmti
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u deploy --hp /home/deploy
```

Run the printed `sudo env ... pm2 startup ...` command, then verify:

```bash
pm2 status
pm2 logs hmti-backend --lines 100
curl -i http://127.0.0.1:3000
```

Update flow:

```bash
sudo -iu deploy
cd /var/www/hmti
git pull
cd hmti-backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart hmti-backend --update-env
pm2 save
```

## 5. Nginx and TLS

Install the example site:

```bash
cp /var/www/hmti/deploy/nginx-hmti.conf.example /etc/nginx/sites-available/hmti-api
sed -i 's/api.example.com/your-api-domain.example/g' /etc/nginx/sites-available/hmti-api
ln -s /etc/nginx/sites-available/hmti-api /etc/nginx/sites-enabled/hmti-api
nginx -t
systemctl reload nginx
```

Issue TLS certificate and enable HTTPS redirect:

```bash
certbot --nginx -d your-api-domain.example
certbot renew --dry-run
```

Verify forwarded headers and HTTPS:

```bash
curl -I https://your-api-domain.example
curl -I -H 'Origin: https://frontend.example.com' https://your-api-domain.example
curl -I -H 'Origin: https://not-allowed.example' https://your-api-domain.example
```

## 6. Cron Backups

Install the backup script:

```bash
install -m 750 -o root -g root /var/www/hmti/deploy/backup-hmti.sh /usr/local/sbin/backup-hmti.sh
mkdir -p /var/backups/hmti /var/log/hmti
chmod 700 /var/backups/hmti
```

Create `/etc/cron.d/hmti-backup`:

```cron
SHELL=/bin/bash
APP_DIR=/var/www/hmti
BACKUP_DIR=/var/backups/hmti
KEEP_DAYS=14

15 2 * * * root /usr/local/sbin/backup-hmti.sh >> /var/log/hmti/backup.log 2>&1
```

Test manually:

```bash
/usr/local/sbin/backup-hmti.sh
ls -lh /var/backups/hmti
tail -n 20 /var/log/hmti/backup.log
```

Restore verification in a controlled directory:

```bash
mkdir -p /tmp/hmti-restore-test
tar -tzf /var/backups/hmti/hmti-YYYYMMDD-HHMMSS.tar.gz
tar -xzf /var/backups/hmti/hmti-YYYYMMDD-HHMMSS.tar.gz -C /tmp/hmti-restore-test
ls -la /tmp/hmti-restore-test
```

For stronger disaster recovery, copy archives off-server with `rsync`, S3-compatible storage, or another VPS account.

## 7. Production Checks

Run after every deploy:

```bash
git status --short
pm2 status
systemctl status nginx --no-pager
ufw status verbose
fail2ban-client status sshd
swapon --show
curl -I https://your-api-domain.example
curl -I -H 'Origin: https://frontend.example.com' https://your-api-domain.example
```

Expected results:

- `dev.db` is not tracked by Git.
- PM2 shows `hmti-backend` online.
- Nginx config test passes.
- UFW allows only SSH, HTTP, and HTTPS.
- fail2ban `sshd` jail is active.
- Swap shows a 2 GB `/swapfile`.
- HTTPS responses include Helmet security headers such as `X-Content-Type-Options`.
- Allowed frontend origins receive matching CORS headers; unknown origins do not.

### Auth verification (wajib setiap deploy)

Token dari login harus diterima oleh endpoint ber-guard. Ini memastikan kunci sign dan verify JWT konsisten (keduanya dari `JWT_SECRET`):

```bash
# 1. Login dan ambil access_token
TOKEN=$(curl -s -X POST https://your-api-domain.example/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"nia":"<nia-valid>","password":"<password>"}' | python3 -c 'import json,sys; print(json.load(sys.stdin)["access_token"])')

# 2. Panggil endpoint ber-guard — harus HTTP 200, bukan 401
curl -s -o /dev/null -w '%{http_code}\n' \
  -H "Authorization: Bearer $TOKEN" \
  https://your-api-domain.example/api/members/me
```

Jika hasilnya 401: pastikan `JWT_SECRET` terisi di `.env`, backend sudah di-`npm run build` ulang, dan `pm2 restart hmti-backend --update-env` sudah dijalankan. Setelah mengganti `JWT_SECRET`, semua user wajib login ulang.
