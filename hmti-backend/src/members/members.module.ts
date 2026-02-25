import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { PrismaService } from '../prisma/prisma.service'; // Import ini

@Module({
  imports: [], 
  controllers: [MembersController],
  providers: [
    MembersService,
    PrismaService // Daftarkan PrismaService di sini
  ],
})
export class MembersModule {}