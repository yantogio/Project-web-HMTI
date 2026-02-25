import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
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