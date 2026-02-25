import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {} // "Masukkan" kunci database

  async create(data: any) {
    // Perintah ini akan menyimpan data ke tabel Member
    return this.prisma.member.create({ data });
  }

  async findAll() {
    return this.prisma.member.findMany();
  }

  // Fungsi Update
  async update(nia: string, data: any) {
    return this.prisma.member.update({
      where: { nia }, // Cari anggota berdasarkan NIA
      data,           // Ganti datanya
    });
  }

  // Fungsi Delete
  async remove(nia: string) {
    return this.prisma.member.delete({
      where: { nia }, // Cari dan hapus berdasarkan NIA
    });
  }

    // FUNGSI KHUSUS UPDATE PROFILE
    async updateProfile(nia: string, data: any) {
      const { email, phone, bio } = data;
  
      try {
        return await this.prisma.member.update({
          where: { nia },
          data: {
            email,
            phone,
            bio,
          },
        });
      } catch (error) {
        throw new Error('Gagal memperbarui profil.');
      }
    }

      // FUNGSI MENCARI SATU ANGGOTA BERDASARKAN NIA
  async findOne(nia: string) {
    const member = await this.prisma.member.findUnique({
      where: { nia },
      // Jangan kirim password ke frontend
      select: {
        nia: true,
        npm: true,
        name: true,
        angkatan: true,
        jabatan: true,
        role: true,
        status: true,
        joinedAt: true,
        email: true,  // Field baru
        phone: true,  // Field baru
        bio: true     // Field baru
      }
    });

    if (!member) {
      throw new Error('Anggota tidak ditemukan');
    }
    return member;
  }

  // FUNGSI UBAH PASSWORD (VERSI HYBRID / PINTAR)
  async changePassword(nia: string, passwords: { currentPassword: string; newPassword: string }) {
    const { currentPassword, newPassword } = passwords;

    // 1. Cari user di database
    const member = await this.prisma.member.findUnique({
      where: { nia },
    });

    if (!member) {
      throw new Error('User tidak ditemukan.');
    }

    // 2. Cek Password (Dua Cara: Aman & Legacy)
    let isPasswordValid = false;

    try {
      // Cara Aman: Bandingkan dengan Hash (Kalau DB sudah aman)
      isPasswordValid = await bcrypt.compare(currentPassword, member.password);
    } catch (e) {
      // Ignore error, lanjut ke cara cek legacy
    }

    // Cara Legacy: Bandingkan Teks Biasa (Kalau DB masih teks biasa)
    // Ini hanya jalan jika cara aman di atas gagal
    if (!isPasswordValid && currentPassword === member.password) {
      isPasswordValid = true;
    }

    if (!isPasswordValid) {
      throw new Error('Password saat ini salah!');
    }

    // 3. Hash Password Baru
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltOrRounds);

    // 4. Update Password di Database
    await this.prisma.member.update({
      where: { nia },
      data: { password: hashedPassword },
    });

    return { message: 'Password berhasil diubah' };
  }
}