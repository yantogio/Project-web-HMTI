import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy, requireJwtSecret } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      // useFactory dievaluasi saat bootstrap (setelah .env dimuat),
      // dan gagal dengan pesan jelas bila JWT_SECRET kosong
      useFactory: () => ({
        secret: requireJwtSecret(), // Kunci rahasia untuk bikin token
        signOptions: { expiresIn: '1d' }, // Token berlaku 1 hari
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, LocalStrategy, JwtStrategy, GoogleStrategy],
})
export class AuthModule {}