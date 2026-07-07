# Design: fix-production-jwt-401

## Context

Backend NestJS memakai Passport JWT. Alur saat ini:

```
LOGIN                                  REQUEST BER-GUARD
─────                                  ─────────────────
auth.service.ts                        jwt.strategy.ts
  jwtService.sign(payload)               secretOrKey:
    │                                    'HMTI_RAHASIA_KEY_...' (hardcoded)
    ▼                                        │
JwtModule.register({                         ▼
  secret: process.env.JWT_SECRET  ──✗──  verifikasi GAGAL di VPS
})                                       (secret beda) → 401
```

Di VPS, `.env` berisi `JWT_SECRET` acak (sesuai panduan deploy), sehingga sign ≠ verify. Frontend sudah benar: interceptor axios menempelkan `Bearer <token>` dari `localStorage.access_token`.

Constraint: VPS RAM 1 GB, backend jalan lewat PM2 (`ecosystem.config.cjs`, tanpa env `JWT_SECRET` — env dimuat dari `.env` via dotenv/Nest ConfigModule saat runtime).

## Goals / Non-Goals

**Goals:**
- Satu sumber kebenaran untuk kunci JWT (`process.env.JWT_SECRET`) untuk sign dan verify.
- Startup gagal dengan pesan jelas bila `JWT_SECRET` tidak diset.
- Menghilangkan secret hardcoded dari kode.

**Non-Goals:**
- Refresh token / rotasi token.
- Perubahan skema payload JWT atau masa berlaku token.
- Perubahan frontend.
- Migrasi ke ConfigModule penuh (cukup pembacaan env konsisten; boleh dipertimbangkan terpisah).

## Decisions

1. **`JwtStrategy` membaca `process.env.JWT_SECRET`** — sama persis dengan `JwtModule.register`. Alternatif: mengganti keduanya ke satu konstanta hardcoded (ditolak: secret di repo = bocor), atau `ConfigService` (bagus, tapi menambah perubahan; env langsung sudah dipakai di `auth.module.ts`, jadi konsisten).
2. **Validasi fail-fast** — di kedua titik (module & strategy) lempar error saat konstruksi jika `JWT_SECRET` kosong, contoh: `throw new Error('JWT_SECRET belum diset di environment')`. Alternatif fallback ke default dev (ditolak: menyembunyikan misconfigurasi, persis bug ini dalam bentuk lain).
3. **Tidak ada grace period untuk token lama** — token yang ditandatangani dengan secret dev tidak pernah valid di produksi, jadi tidak ada yang perlu dimigrasikan; user cukup login ulang.

## Risks / Trade-offs

- [Deploy lupa rebuild] → Perubahan ada di TypeScript; wajib `npm run build` + `pm2 restart` di VPS. Task deploy eksplisit mencantumkan ini.
- [`JWT_SECRET` kosong di dev lokal] → Startup akan gagal fail-fast; tambahkan `JWT_SECRET` ke `.env.example` / dokumentasi agar developer lokal tahu.
- [User yang sedang login mengira sistem rusak] → Setelah deploy semua sesi lama tetap 401 sampai login ulang; frontend sudah punya penanganan 401 → arahkan login ulang. Komunikasikan ke pengurus.

## Migration Plan

1. Ubah kode, build lokal, verifikasi login + panggil endpoint ber-guard di dev.
2. Di VPS: pastikan `JWT_SECRET` ada di `.env` backend → `git pull` / upload → `npm run build` → `pm2 restart hmti-backend`.
3. Verifikasi: login lewat browser, buka halaman Keuangan/Profil/Showcase; atau `curl -H "Authorization: Bearer <token>" http://163.61.58.127/api/members/me` harus 200.
4. Rollback: revert commit + rebuild (kondisi kembali seperti sekarang, tidak lebih buruk).

## Open Questions

- Tidak ada yang memblokir. (Opsional ke depan: pindah semua pembacaan env ke `@nestjs/config` dengan validasi skema.)
