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
      const driveResponse = await this.googleDriveService.uploadFile(file, targetFolderId);

      // 2. Simpan metadata ke Database SQLite
      return await this.prisma.document.create({
        data: {
          title: dto.title,
          type: dto.type,
          category: file.mimetype,
          fileUrl: driveResponse.webViewLink,
          driveFileId: driveResponse.id,
          description: dto.description || '',
          uploadedByNia: uploaderNia,
        },
      });
    } catch (error) {
      this.logger.error(`Gagal upload: ${error.message}`);
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
        this.logger.error(`Gagal hapus di Drive: ${e.message}`);
      }
    }

    // 3. Hapus di Database
    return this.prisma.document.delete({ where: { id } });
  }

  async findAll() {
    return this.prisma.document.findMany({
      include: { 
        uploader: { 
          select: { name: true } 
        } 
      },
      orderBy: { uploadDate: 'desc' }
    });
  }
}