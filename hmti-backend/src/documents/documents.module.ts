// src/documents/documents.module.ts
import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { GoogleDriveService } from './google-drive.service'; 

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, GoogleDriveService], 
})
export class DocumentsModule {}