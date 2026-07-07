// src/documents/dto/create-document.dto.ts
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsIn(['SURAT_MASUK', 'SURAT_KELUAR', 'MEDIA', 'BRANDING'])
  type: 'SURAT_MASUK' | 'SURAT_KELUAR' | 'MEDIA' | 'BRANDING';

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
