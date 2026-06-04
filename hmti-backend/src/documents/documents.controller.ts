import { Controller, Post, Get, Delete, Body, UseInterceptors, UploadedFile, BadRequestException, UseGuards, Req, Param, ParseIntPipe, Res, NotFoundException, Query } from '@nestjs/common';
import type { Response } from 'express';
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
  async getAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    
    return this.documentsService.findAll(pageNum, limitNum);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('sekretaris')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.remove(id);
  }

  @Get('preview/:id')
  async preview(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    try {
      const doc = await this.documentsService.findOne(id);
      if (!doc) {
        throw new NotFoundException('Dokumen tidak ditemukan');
      }

      if (!doc.driveFileId) {
        throw new NotFoundException('Drive file ID tidak tersedia');
      }

      // Set cache headers: no cache untuk video/live content, tapi browser bisa cache images
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Set content type
      res.setHeader('Content-Type', doc.category || 'application/octet-stream');
      
      // Set timeout untuk client: 5 menit
      res.setTimeout(5 * 60 * 1000);

      const stream = await this.documentsService.getDriveFileStream(doc.driveFileId);
      
      // Error handling untuk stream
      stream.on('error', (error) => {
        console.error('Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Stream error' });
        }
      });

      res.on('error', (error) => {
        console.error('Response error:', error);
        stream.destroy();
      });

      stream.pipe(res);
    } catch (error) {
      if (!res.headersSent) {
        if (error instanceof NotFoundException) {
          res.status(404).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Failed to load preview' });
        }
      }
    }
  }
}