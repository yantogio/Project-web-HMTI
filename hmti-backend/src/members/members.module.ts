import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleDriveService } from '../documents/google-drive.service';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [MembersController],
  providers: [
    MembersService,
    PrismaService,
    GoogleDriveService,
  ],
})
export class MembersModule {}
