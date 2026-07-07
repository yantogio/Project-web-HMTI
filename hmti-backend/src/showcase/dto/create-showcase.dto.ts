import { Allow, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateShowcaseDto {
  @IsString()
  @IsNotEmpty()
  category: string; // 'prestasi' | 'event' | 'kegiatan'

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  dateTime?: string;

  // Bisa datang sebagai number (JSON) atau string (multipart form-data)
  @Allow()
  documentId?: number | string; // ID dari tabel Document

  @Allow()
  isVisible?: boolean | string;
}
