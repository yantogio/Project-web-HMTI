import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { MembersService } from './members.service';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) { }

  // ==========================================
  // 1. ROUTE KHUSUS DIRI SENDIRI (/me)
  // Harus di Paling Atas agar prioritas lebih tinggi
  // ==========================================

  // Ambil Profil Saya
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@Request() req) {
    return this.membersService.findOne(req.user.nia);
  }

  // Update Profil Saya (Email, Phone, Bio)
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMyProfile(@Request() req, @Body() updateProfileDto: any) {
    return this.membersService.updateProfile(req.user.nia, updateProfileDto);
  }

  // Upload / Ganti Foto Profil
  @Patch('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', {
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Hanya file JPEG, PNG, atau WebP yang diizinkan'), false);
      }
    },
  }))
  async updateMyAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File gambar tidak ditemukan dalam request.');
    return this.membersService.updateAvatar(req.user.nia, file);
  }

  // Ubah Password Saya
  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  changeMyPassword(@Request() req, @Body() changePasswordDto: { currentPassword: string; newPassword: string }) {
    return this.membersService.changePassword(req.user.nia, changePasswordDto);
  }

  // ==========================================
  // 2. ROUTE UMUM / ADMIN
  // ==========================================

  // Tambah Anggota Baru
  @Post()
  create(@Body() data: any) {
    return this.membersService.create(data);
  }

  // Lihat Semua Anggota
  @Get()
  findAll() {
    return this.membersService.findAll();
  }

  // Download template Excel untuk import anggota
  @Get('import-template')
  async downloadImportTemplate(@Res() res: Response) {
    const buffer = await this.membersService.generateImportTemplate();
    res.setHeader('Content-Disposition', 'attachment; filename="Template-Import-Anggota.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  }

  // Import anggota massal dari file Excel
  @Post('import')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async importMembers(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan dalam request');
    }
    const validMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Format file tidak didukung. Gunakan file .xlsx');
    }
    return this.membersService.importFromExcel(file);
  }

  // Stream foto profil dari Google Drive by NIA (pola sama seperti /documents/preview/:id)
  @Get(':nia/avatar')
  async streamAvatar(@Param('nia') nia: string, @Res() res: Response) {
    try {
      res.setHeader('Cache-Control', 'private, max-age=300'); // cache 5 menit
      res.setHeader('Content-Type', 'image/jpeg');
      res.setTimeout(30000);

      const stream = await this.membersService.streamAvatarByNia(nia);

      stream.on('error', () => {
        if (!res.headersSent) res.status(500).json({ error: 'Stream error' });
      });
      res.on('error', () => stream.destroy());

      stream.pipe(res);
    } catch (error) {
      if (!res.headersSent) {
        if (error instanceof NotFoundException) {
          res.status(404).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Gagal memuat foto profil' });
        }
      }
    }
  }

  // Update Anggota Lain (Admin Only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ketum', 'sekretaris', 'bendahara')
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.membersService.update(id, data);
  }

  // Hapus Anggota (Admin Only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ketum', 'sekretaris', 'bendahara')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.membersService.remove(id);
  }
}
