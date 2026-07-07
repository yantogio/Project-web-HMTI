export class CreateShowcaseDto {
  category: string; // 'prestasi' | 'event' | 'kegiatan'
  title: string;
  description?: string;
  dateTime?: string;
  documentId?: number | string; // ID dari tabel Document
  isVisible?: boolean | string;
}
