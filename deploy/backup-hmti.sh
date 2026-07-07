#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/hmti}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/hmti}"
KEEP_DAYS="${KEEP_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="$BACKUP_DIR/hmti-$TIMESTAMP.tar.gz"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

tar \
  --exclude='hmti-backend/node_modules' \
  --exclude='hmti-frontend/node_modules' \
  --exclude='hmti-backend/dist' \
  --exclude='.git' \
  -czf "$ARCHIVE" \
  -C "$APP_DIR" \
  hmti-backend/prisma \
  uploads

chmod 600 "$ARCHIVE"
find "$BACKUP_DIR" -type f -name 'hmti-*.tar.gz' -mtime +"$KEEP_DAYS" -delete

echo "$(date --iso-8601=seconds) created $ARCHIVE"
