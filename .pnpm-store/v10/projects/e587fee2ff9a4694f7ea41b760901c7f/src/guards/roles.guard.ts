import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Ambil Role yang diperbolehkan dari Stiker (Decorator)
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Kalau tidak ada aturan role, berarti boleh masuk siapa saja (public)
    if (!requiredRoles) {
      return true;
    }

    // 2. Ambil User dari Request (Token yang sudah di-verify oleh JwtStrategy)
    const { user } = context.switchToHttp().getRequest();

    // 3. Cek apakah Role user ada di daftar Role yang diperbolehkan
    return requiredRoles.some((role) => user.role === role);
  }
}