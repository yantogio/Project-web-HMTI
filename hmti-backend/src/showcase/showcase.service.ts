import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';
import { CreateShowcaseDto } from './dto/create-showcase.dto';

@Injectable()
export class ShowcaseService {
  private readonly logger = new Logger(ShowcaseService.name);

  constructor(
    private prisma: PrismaService,
    private documentsService: DocumentsService,
  ) {}

  findAll() {
    return this.prisma.showcaseContent.findMany({
      include: { document: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findActive() {
    return this.prisma.showcaseContent.findMany({
      where: { isVisible: true },
      include: { document: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateShowcaseDto, file: Express.Multer.File | undefined, uploaderNia: string) {
    let documentId: number | null = dto.documentId ? Number(dto.documentId) : null;

    if (file) {
      // Opsi "Upload Baru": delegasikan ke DocumentsService (Single Source of Truth)
      this.logger.log(`Upload baru untuk showcase: ${file.originalname}`);
      const doc = await this.documentsService.create(
        { title: dto.title, type: 'MEDIA', description: dto.description },
        file,
        uploaderNia,
      );
      documentId = doc.id;
    }

    return this.prisma.showcaseContent.create({
      data: {
        category: dto.category,
        title: dto.title,
        description: dto.description || null,
        dateTime: dto.dateTime ? new Date(dto.dateTime) : null,
        documentId,
        isVisible: dto.isVisible === true || String(dto.isVisible) === 'true',
      },
      include: { document: true },
    });
  }

  async toggleVisibility(id: number) {
    const item = await this.prisma.showcaseContent.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item tidak ditemukan');
    return this.prisma.showcaseContent.update({
      where: { id },
      data: { isVisible: !item.isVisible },
      include: { document: true },
    });
  }

  async remove(id: number) {
    const item = await this.prisma.showcaseContent.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item tidak ditemukan');
    // Hanya hapus baris showcase — Document tetap ada (Single Source of Truth)
    return this.prisma.showcaseContent.delete({ where: { id } });
  }
}
