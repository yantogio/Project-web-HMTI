import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';

@Injectable()
export class GoogleDriveService {
  private drive;
  private readonly logger = new Logger(GoogleDriveService.name);

  constructor() {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_DRIVE_CLIENT_ID,
        process.env.GOOGLE_DRIVE_CLIENT_SECRET
      );
      oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN });
      this.drive = google.drive({ version: 'v3', auth: oauth2Client });
    } catch (e) {
      this.logger.error('Gagal inisialisasi Drive');
    }
  }

  async uploadFile(file: Express.Multer.File, targetFolderId?: string) {
    if (!this.drive) throw new InternalServerErrorException('Drive Service Down');

    // FIXER: Jika Windows mengirim octet-stream, kita paksa berdasarkan ekstensi
    let detectedMime = file.mimetype;
    if (detectedMime === 'application/octet-stream') {
      const ext = file.originalname?.split('.').pop()?.toLowerCase() ?? '';

      if (ext === 'pdf') detectedMime = 'application/pdf';
      if (ext === 'docx') detectedMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if (ext === 'png') detectedMime = 'image/png';
      if (ext === 'jpg' || ext === 'jpeg') detectedMime = 'image/jpeg';
    }

    try {
      const response = await this.drive.files.create({
        requestBody: {
          name: `${Date.now()}-${file.originalname}`,
          parents: [targetFolderId || process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID],
        },
        media: {
          mimeType: detectedMime,
          body: Readable.from(file.buffer), // Cara paling stabil kirim buffer
        },
        fields: 'id, webViewLink',
      });

      const fileId = response.data.id;

      if (!fileId) {
        throw new InternalServerErrorException('Drive tidak mengembalikan fileId');
      }

      // Pastikan file bisa diakses publik untuk kebutuhan preview di frontend.
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      // Ambil ulang metadata setelah permission diset agar link final siap dipakai.
      const publicFile = await this.drive.files.get({
        fileId,
        fields: 'id, webViewLink, webContentLink, thumbnailLink',
      });

      return publicFile.data;
    } catch (error) {
      this.logger.error(`Drive Error: ${error.message}`);
      throw new InternalServerErrorException('Gagal upload ke Cloud');
    }
  }

  async deleteFile(fileId: string) {
    try {
      // Gunakan this.drive, bukan this.driveClient
      return await this.drive.files.delete({
        fileId: fileId,
      });
    } catch (error) {
      this.logger.error(`Gagal menghapus file di Drive: ${error.message}`);
      throw new InternalServerErrorException(`Gagal menghapus file di Drive: ${error.message}`);
    }
  }
}