import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async googleLogin(user) {
    if (!user) {
      return 'No user from google';
    }

    return {
      message: 'User information from google',
      user: user,
    };
  }

  async validateUser(nia: string, password: string): Promise<any> {
    const user = await this.prisma.member.findUnique({
      where: { nia: nia }
    });

    if (!user) return null;

    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (e) {
    }

    if (!isPasswordValid && password === user.password) {
      isPasswordValid = true;
    }

    if (isPasswordValid) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  // Fungsi Login: Buatkan Token (Tiket Masuk)
  async login(user: any) {
    const payload = { nia: user.nia, sub: user.nia, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: user // Kita kirim juga data user biar Frontend tahu siapa yang login
    };
  }
}