import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Ini menghubungkan dengan 'jwt' yang sudah kita setting di auth.module.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}