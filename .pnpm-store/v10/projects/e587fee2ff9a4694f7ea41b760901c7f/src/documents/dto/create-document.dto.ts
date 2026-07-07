// src/documents/dto/create-document.dto.ts
export class CreateDocumentDto {
    title: string;
    type: 'SURAT_MASUK' | 'SURAT_KELUAR' | 'MEDIA' | 'BRANDING';
    category?: string;
    description?: string;
  }