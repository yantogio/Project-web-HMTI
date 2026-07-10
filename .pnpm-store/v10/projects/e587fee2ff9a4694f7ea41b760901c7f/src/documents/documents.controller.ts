import { Controller, Post, Get, Delete, Body, UseInterceptors, UploadedFile, BadRequestException, UseGuards, Req, Param, ParseIntPipe, Res, NotFoundException, Query, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { Readable } from 'stream';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('documents')
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(private readonly documentsService: DocumentsService) {}

  // Publik: tidak memakai GoogleDriveService karena scope OAuth backend adalah
  // drive.file, yang hanya menjangkau berkas yang dibuat aplikasi ini sendiri.
  // APK diunggah manual ke Drive, jadi diambil anonim sebagai berkas "anyone with link".
  @Get('app/apk')
  async downloadApk(@Res() res: Response) {
    const fileId = process.env.EHMTI_APK_FILE_ID;

    if (!fileId) {
      this.logger.warn('EHMTI_APK_FILE_ID belum diset; endpoint unduhan APK nonaktif');
      res.status(503).json({ error: 'Unduhan aplikasi belum tersedia' });
      return;
    }

    const driveUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`;

    try {
      const upstream = await fetch(driveUrl, { redirect: 'follow' });
      const upstreamType = upstream.headers.get('content-type') ?? '';

      // Drive membalas HTML (layar login / peringatan) saat berbagi dicabut.
      // Meneruskannya akan menghasilkan E-HMTI.apk rusak berisi HTML.
      if (!upstream.ok || !upstream.body || upstreamType.includes('text/html')) {
        this.logger.error(
          `Drive menolak APK: status=${upstream.status} content-type=${upstreamType}`,
        );
        res.status(404).json({
          error: 'File aplikasi tidak dapat diakses saat ini. Silakan coba lagi nanti.',
        });
        return;
      }

      const contentLength = upstream.headers.get('content-length');
      if (contentLength) res.setHeader('Content-Length', contentLength);

      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename="E-HMTI.apk"');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setTimeout(5 * 60 * 1000);

      const stream = Readable.fromWeb(upstream.body as any);

      stream.on('error', (error) => {
        this.logger.error(`Stream APK terputus: ${error.message}`);
        res.destroy();
      });

      res.on('error', () => stream.destroy());
      res.on('close', () => stream.destroy());

      stream.pipe(res);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Gagal mengambil APK dari Drive: ${message}`);

      if (!res.headersSent) {
        res.status(404).json({
          error: 'File aplikasi tidak dapat diakses saat ini. Silakan coba lagi nanti.',
        });
      } else {
        res.destroy();
      }
    }
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ketum', 'bendahara', 'sekretaris')
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

    // Penegakan tipe file per kategori di server agar tidak bisa di-bypass
    // lewat request langsung (client hanya menyaring picker).
    const mime = file.mimetype ?? '';
    const name = (file.originalname ?? '').toLowerCase();

    // Media Event hanya untuk foto & video.
    if (dto.type === 'MEDIA') {
      const isMedia = mime.startsWith('image/') || mime.startsWith('video/');
      if (!isMedia) {
        throw new BadRequestException('Media Event hanya menerima file foto (image/*) atau video (video/*).');
      }
    }

    // Branding Kit hanya untuk gambar atau file desain (tanpa video/dokumen).
    if (dto.type === 'BRANDING') {
      const brandingExts = ['.psd', '.ai', '.fig', '.sketch', '.svg', '.eps'];
      const isImage = mime.startsWith('image/');
      const isDesign = brandingExts.some((ext) => name.endsWith(ext));
      if (!isImage && !isDesign) {
        throw new BadRequestException('Branding Kit hanya menerima gambar atau file desain (PSD, AI, FIG, SKETCH, SVG, EPS).');
      }
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
  @Roles('ketum', 'bendahara', 'sekretaris')
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

  @Get('download/:id')
  async download(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    try {
      const doc = await this.documentsService.findOne(id);
      if (!doc) {
        throw new NotFoundException('Dokumen tidak ditemukan');
      }

      if (!doc.driveFileId) {
        throw new NotFoundException('Drive file ID tidak tersedia');
      }

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', doc.category || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.title)}"`);
      res.setTimeout(5 * 60 * 1000);

      const stream = await this.documentsService.getDriveFileStream(doc.driveFileId);
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
          res.status(500).json({ error: 'Failed to download file' });
        }
      }
    }
  }
}