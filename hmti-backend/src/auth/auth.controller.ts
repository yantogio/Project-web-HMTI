import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('local')) // Gunakan Sentry (LocalStrategy) untuk jaga pintu ini
  @Post('login')
  async login(@Request() req) {
    // Jika code nyampe sini, berarti NIA & Password sudah VALID (sudah lewat validateUser)
    return this.authService.login(req.user);
  }
}