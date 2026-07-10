import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { GoogleDriveService } from '../documents/google-drive.service';
import { UpdateMemberDto } from './dto/update-member.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import * as ExcelJS from 'exceljs';

// Kolom aman untuk dikirim ke klien. Allowlist eksplisit: kolom sensitif
// (password) dan server-managed (avatarDriveFileId) tidak pernah ikut, dan
// kolom baru pada skema tidak bocor otomatis. Cermin dari select di findOne().
const MEMBER_PUBLIC_SELECT = {
  nia: true,
  npm: true,
  name: true,
  angkatan: true,
  jabatan: true,
  role: true,
  status: true,
  joinedAt: true,
  email: true,
  phone: true,
  bio: true,
  avatarUrl: true,
} as const;

@Injectable()
export class MembersService {
  constructor(
    private prisma: PrismaService,
    private googleDriveService: GoogleDriveService,
  ) {}

  async create(data: CreateMemberDto) {
    // password sengaja tidak diterima dari body → schema @default("password123")
    // yang mengisi. Alur generate akun tidak berubah.
    return this.prisma.member.create({
      data,
      select: MEMBER_PUBLIC_SELECT,
    });
  }

  async findAll() {
    return this.prisma.member.findMany({ select: MEMBER_PUBLIC_SELECT });
  }

  // Fungsi Update — data sudah divalidasi & di-whitelist oleh UpdateMemberDto
  async update(nia: string, data: UpdateMemberDto) {
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
        email: true,
        phone: true,
        bio: true,
        avatarUrl: true
      }
    });

    if (!member) {
      throw new Error('Anggota tidak ditemukan');
    }
    return member;
  }

  async updateAvatar(nia: string, file: Express.Multer.File) {
    const member = await this.prisma.member.findUnique({ where: { nia } });
    if (!member) throw new Error('Anggota tidak ditemukan');

    // Hapus file lama dari Google Drive jika ada
    if (member.avatarDriveFileId) {
      this.googleDriveService.deleteFile(member.avatarDriveFileId).catch(() => {});
    }

    // Upload file baru ke Google Drive folder Foto Profil Anggota
    const driveFile = await this.googleDriveService.uploadFile(file, process.env.FOLDER_ID_AVATARS);
    const fileId = driveFile.id;

    // Simpan URL berbasis NIA (stabil, tidak berubah saat ganti foto)
    // Timestamp di query param untuk bust cache browser saat upload baru
    const timestamp = Date.now();
    const avatarUrl = `/members/${nia}/avatar?t=${timestamp}`;

    await this.prisma.member.update({
      where: { nia },
      data: {
        avatarUrl,
        avatarDriveFileId: fileId,
      },
    });

    return { avatarUrl };
  }

  // Stream foto profil dari Google Drive berdasarkan NIA anggota
  async streamAvatarByNia(nia: string) {
    const member = await this.prisma.member.findUnique({ where: { nia } });
    if (!member) throw new NotFoundException('Anggota tidak ditemukan');
    if (!member.avatarDriveFileId) throw new NotFoundException('Foto profil belum diupload');

    return this.googleDriveService.getFileStream(member.avatarDriveFileId);
  }

  async generateImportTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Import Anggota');

    sheet.columns = [
      { key: 'nia', width: 22 },
      { key: 'npm', width: 18 },
      { key: 'name', width: 30 },
      { key: 'angkatan', width: 14 },
      { key: 'jabatan', width: 22 },
      { key: 'role', width: 20 },
      { key: 'status', width: 16 },
      { key: 'notes', width: 52 },
    ];

    // Row 1: Judul
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'Template Import Anggota HMTI';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
    sheet.getRow(1).height = 28;

    // Row 2: Instruksi
    sheet.mergeCells('A2:H2');
    const instrCell = sheet.getCell('A2');
    instrCell.value = 'Isi data anggota mulai dari BARIS 5. Baris 3 = Header, Baris 4 = Panduan nilai. Jangan ubah/hapus baris 1–4.';
    instrCell.font = { italic: true, size: 10, color: { argb: 'FF374151' } };
    instrCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: false };
    instrCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
    sheet.getRow(2).height = 20;

    // Row 3: Header kolom
    const headerRow = sheet.getRow(3);
    headerRow.values = ['NIA', 'NPM', 'Nama Lengkap', 'Angkatan', 'Jabatan', 'Role', 'Status', 'PANDUAN NILAI'];
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 20;
    const headerBorder: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FF1E3A8A' } };
    const headerBorders = { top: headerBorder, left: headerBorder, bottom: headerBorder, right: headerBorder };
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      cell.border = headerBorders;
    });

    // Row 4: Panduan nilai (baris keterangan, bukan data)
    const notesRow = sheet.getRow(4);
    notesRow.values = [
      'Contoh: HMTI-2024-001',
      'Contoh: 2024001001',
      'Contoh: Budi Santoso',
      'Contoh: 2024',
      'Contoh: Staff / Kadiv',
      'Opsi: ketum / sekretaris / bendahara / anggota',
      'Opsi: Aktif / Tidak Aktif',
      '⚠ NIA & NPM harus UNIK. Baris ini adalah panduan — jangan diisi sebagai data.',
    ];
    notesRow.font = { italic: true, size: 9, color: { argb: 'FF6B7280' } };
    notesRow.height = 18;
    const notesBorder: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFD1D5DB' } };
    const notesBorders = { top: notesBorder, left: notesBorder, bottom: notesBorder, right: notesBorder };
    notesRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      cell.border = notesBorders;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async importFromExcel(file: Express.Multer.File): Promise<{ imported: number; skipped: number; errors: Array<{ row: number; reason: string }> }> {
    const workbook = new ExcelJS.Workbook();
    const ab = file.buffer.buffer.slice(
      file.buffer.byteOffset,
      file.buffer.byteOffset + file.buffer.byteLength,
    ) as ArrayBuffer;
    await workbook.xlsx.load(ab);

    const sheet = workbook.getWorksheet('Import Anggota') ?? workbook.worksheets[0];
    const hashedPassword = await bcrypt.hash('password123', 10);

    let imported = 0;
    let skipped = 0;
    const errors: Array<{ row: number; reason: string }> = [];
    const VALID_ROLES = ['ketum', 'sekretaris', 'bendahara', 'anggota'];

    // Kumpulkan semua baris dulu (tidak bisa pakai async di dalam eachRow)
    const dataRows: Array<{ rowNumber: number; values: any[] }> = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber >= 5) {
        dataRows.push({ rowNumber, values: row.values as any[] });
      }
    });

    for (const { rowNumber, values } of dataRows) {
      const nia = String(values[1] ?? '').trim();
      const npm = String(values[2] ?? '').trim();
      const name = String(values[3] ?? '').trim();
      const angkatan = String(values[4] ?? '').trim();
      const jabatan = String(values[5] ?? '').trim();
      const rawRole = String(values[6] ?? '').trim();
      const role = rawRole.toLowerCase();
      const rawStatus = String(values[7] ?? '').trim();
      const status = rawStatus || 'Aktif';

      // Lewati baris yang sepenuhnya kosong
      if (!nia && !npm && !name) continue;

      // Validasi field wajib
      const missingFields: string[] = [];
      if (!nia) missingFields.push('NIA');
      if (!npm) missingFields.push('NPM');
      if (!name) missingFields.push('Nama Lengkap');
      if (!angkatan) missingFields.push('Angkatan');
      if (!jabatan) missingFields.push('Jabatan');
      if (!rawRole) missingFields.push('Role');

      if (missingFields.length > 0) {
        errors.push({ row: rowNumber, reason: `Field wajib kosong: ${missingFields.join(', ')}` });
        skipped++;
        continue;
      }

      // Validasi nilai role
      if (!VALID_ROLES.includes(role)) {
        errors.push({ row: rowNumber, reason: `Nilai Role tidak valid: "${rawRole}". Gunakan: ketum / sekretaris / bendahara / anggota` });
        skipped++;
        continue;
      }

      // Simpan ke database
      try {
        await this.prisma.member.create({
          data: { nia, npm, name, angkatan, jabatan, role, status, password: hashedPassword },
        });
        imported++;
      } catch (e: any) {
        if (e.code === 'P2002') {
          const target = e.meta?.target;
          const field = Array.isArray(target) ? target[0].toUpperCase() : 'NIA/NPM';
          errors.push({ row: rowNumber, reason: `${field} sudah terdaftar` });
        } else {
          errors.push({ row: rowNumber, reason: `Gagal menyimpan: ${e.message}` });
        }
        skipped++;
      }
    }

    return { imported, skipped, errors };
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
