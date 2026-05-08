import { Controller, Post, Get, Delete, Body, UseInterceptors, UploadedFile, BadRequestException, UseGuards, Req, Param, ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard) 
  @Roles('sekretaris') 
  @UseInterceptors(FileInterceptor('file', { 
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // Batas 10MB
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File, 
    @Body() dto: CreateDocumentDto,
    @Req() req: any
  ) {
    if (!file) {
      throw new BadRequestException('File tidak terdeteksi! Cek Key di Postman harus bernama "file"');
    }

    // Debugging untuk melihat apakah Windows membaca file dengan benar
    console.log('--- DEBUG UPLOAD ---');
    console.log('Nama File:', file.originalname);
    console.log('MimeType:', file.mimetype);
    console.log('Ukuran:', file.size, 'bytes');

    const uploaderNia = req.user.nia; 
    return this.documentsService.create(dto, file, uploaderNia);
  }

  @Get()
  async getAll() {
    return this.documentsService.findAll();
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('sekretaris')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.remove(id);
  }
}