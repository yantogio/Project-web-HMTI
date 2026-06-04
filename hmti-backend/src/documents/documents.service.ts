import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { GoogleDriveService } from './google-drive.service';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private googleDriveService: GoogleDriveService
  ) {}

  async create(dto: CreateDocumentDto, file: Express.Multer.File, uploaderNia: string) {
    try {
      this.logger.log(`Memulai upload ke Google Drive: ${file.originalname}`);

      // --- LOGIKA PEMILIHAN FOLDER OTOMATIS ---
      // Ambil Folder ID dari .env. Pastikan namanya sama persis dengan di file .env kamu!
      let targetFolderId = process.env.FOLDER_ID_SURAT; // Default ke folder surat

      if (dto.type === 'MEDIA') {
        targetFolderId = process.env.FOLDER_ID_MEDIA;
      } else if (dto.type === 'BRANDING') {
        targetFolderId = process.env.FOLDER_ID_BRANDING;
      }

      // 1. Upload ke Google Drive dengan menyertakan Folder ID tujuan
      // Kita tambahkan parameter kedua: targetFolderId
      const publicFile = await this.googleDriveService.uploadFile(file, targetFolderId);

      // 2. Simpan metadata ke Database SQLite
      return await this.prisma.document.create({
        data: {
          title: dto.title,
          type: dto.type,
          category: file.mimetype,
          fileUrl: publicFile.webContentLink || publicFile.webViewLink,
          driveFileId: publicFile.id,
          description: dto.description || '',
          uploadedByNia: uploaderNia,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Gagal upload: ${message}`);
      throw new InternalServerErrorException('Gagal memproses dokumen ke Cloud Storage');
    }
  }

  async remove(id: number) {
    // 1. Cari data di DB untuk dapat driveFileId
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Dokumen tidak ada');

    // 2. Hapus di Google Drive (Pastikan driveFileId != null sebelum hapus)
    if (doc.driveFileId) {
      try {
        await this.googleDriveService.deleteFile(doc.driveFileId);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        this.logger.error(`Gagal hapus di Drive: ${message}`);
      }
    }

    // 3. Hapus di Database
    return this.prisma.document.delete({ where: { id } });
  }

  async findOne(id: number) {
    return this.prisma.document.findUnique({
      where: { id },
      include: {
        uploader: {
          select: { name: true }
        }
      }
    });
  }

  async getDriveFileStream(fileId: string) {
    if (!fileId) {
      throw new NotFoundException('Drive file ID tidak tersedia');
    }
    return this.googleDriveService.getFileStream(fileId);
  }

  async findAll(page: number = 1, limit: number = 20) {
    // Validasi input
    page = Math.max(1, page);
    limit = Math.min(100, Math.max(1, limit)); // Max 100 per page
    
    const skip = (page - 1) * limit;

    // Get total count untuk pagination info
    const total = await this.prisma.document.count();

    // Get documents dengan pagination
    const documents = await this.prisma.document.findMany({
      include: { 
        uploader: { 
          select: { name: true } 
        } 
      },
      orderBy: { uploadDate: 'desc' },
      skip,
      take: limit
    });

    return {
      data: documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}