import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

// Kunci rahasia diambil dari environment; wajib diset agar sign & verify konsisten
export function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET belum diset di environment. Isi JWT_SECRET di file .env sebelum menjalankan backend.',
    );
  }
  return secret;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      // Cara mengambil Token dari Header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Tidak mengabaikan token kadaluarsa
      ignoreExpiration: false,
      // Kunci rahasia harus SAMA PERSIS dengan yang dipakai saat sign di auth.module.ts
      secretOrKey: requireJwtSecret(),
    });
  }

  async validate(payload: any) {
    // TAMBAHKAN INI:
    // Cek apakah payload menggunakan key 'nia' atau 'sub' (standar JWT)
    const nia = payload.nia || payload.sub;

    if (!nia) {
      throw new UnauthorizedException('Token tidak valid: ID pengguna tidak ditemukan.');
    }

    // Cek ke database
    const user = await this.prisma.member.findUnique({
      where: { nia }
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan di database.');
    }

    return { 
      nia: user.nia, 
      role: user.role, 
      name: user.name,
      jabatan: user.jabatan
    };
  }
}