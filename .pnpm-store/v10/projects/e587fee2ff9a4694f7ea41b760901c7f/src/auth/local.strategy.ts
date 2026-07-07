import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    // Kita beri tahu passport bahwa USERNAME kita adalah NIA
    super({ usernameField: 'nia' });
  }

  async validate(nia: string, password: string): Promise<any> {
    // Cek ke service: NIA & Password bener nggak?
    const user = await this.authService.validateUser(nia, password);
    
    if (!user) {
      throw new UnauthorizedException('NIA atau Password salah!');
    }
    return user;
  }
}