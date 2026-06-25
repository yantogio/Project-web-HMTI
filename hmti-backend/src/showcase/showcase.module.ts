import { Module } from '@nestjs/common';
import { ShowcaseController } from './showcase.controller';
import { ShowcaseService } from './showcase.service';
import { DocumentsModule } from '../documents/documents.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [DocumentsModule],
  controllers: [ShowcaseController],
  providers: [ShowcaseService, PrismaService],
})
export class ShowcaseModule {}
