import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Kita buat @Global() agar PrismaService bisa dipakai di mana saja
// tanpa harus di-import di setiap module lain (Members, Transaction, dll)
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}