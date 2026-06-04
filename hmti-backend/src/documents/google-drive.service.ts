import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';

// Try to load node-cache, fallback if not available
let NodeCache: any;
try {
  NodeCache = require('node-cache');
} catch (e) {
  // node-cache not installed, will use dummy cache
  NodeCache = null;
}

@Injectable()
export class GoogleDriveService {
  private drive;
  private readonly logger = new Logger(GoogleDriveService.name);
  private cache: any = null;

  constructor() {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_DRIVE_CLIENT_ID,
        process.env.GOOGLE_DRIVE_CLIENT_SECRET
      );
      oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN });
      this.drive = google.drive({ version: 'v3', auth: oauth2Client });
      
      // Initialize cache if available
      if (NodeCache) {
        this.cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
        this.logger.log('✅ Cache enabled (node-cache)');
      } else {
        this.logger.warn('⚠️ Cache disabled (install node-cache for better performance)');
      }
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
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Drive Error: ${message}`);
      throw new InternalServerErrorException('Gagal upload ke Cloud');
    }
  }

  async getFileStream(fileId: string, retries = 3) {
    if (!this.drive) throw new InternalServerErrorException('Drive Service Down');

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await this.drive.files.get(
          {
            fileId,
            alt: 'media',
          },
          {
            responseType: 'stream',
            timeout: 30000, // 30 detik timeout
          }
        );

        // Setup stream error handling
        response.data.on('error', (error) => {
          this.logger.error(`Stream error untuk fileId ${fileId}: ${error.message}`);
        });

        return response.data;
      } catch (error) {
        const statusCode = (error as any)?.response?.status || 0;
        const message = error instanceof Error ? error.message : String(error);

        // Jika 429 (Too Many Requests) dan bukan attempt terakhir, retry dengan exponential backoff
        if (statusCode === 429 && attempt < retries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          this.logger.warn(`Rate limited. Retry attempt ${attempt + 1}/${retries} dalam ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Jika 404 atau error permission, jangan retry
        if (statusCode === 404 || statusCode === 403) {
          this.logger.error(`Gagal akses file ${fileId}: ${statusCode} ${message}`);
          throw new InternalServerErrorException(`File tidak dapat diakses (${statusCode})`);
        }

        // Jika error lainnya dan bukan attempt terakhir, retry
        if (attempt < retries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          this.logger.warn(`Error saat stream (${statusCode}). Retry ${attempt + 1}/${retries} dalam ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Attempt terakhir gagal
        this.logger.error(`Gagal ambil file stream setelah ${retries} attempts: ${message}`);
        throw new InternalServerErrorException('Gagal memuat file dari Drive');
      }
    }
  }

  async deleteFile(fileId: string) {
    try {
      // Gunakan this.drive, bukan this.driveClient
      return await this.drive.files.delete({
        fileId: fileId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Gagal menghapus file di Drive: ${message}`);
      throw new InternalServerErrorException(`Gagal menghapus file di Drive: ${message}`);
    }
  }
}