import { IsOptional, IsString, IsEmail, MaxLength } from 'class-validator';

/**
 * DTO untuk pembuatan anggota (POST /members).
 *
 * Whitelist eksplisit. Dengan ValidationPipe global (whitelist +
 * forbidNonWhitelisted), field asing ditolak 400, bukan diteruskan mentah ke
 * Prisma (yang sebelumnya menyebabkan 500 dan membuka penyuntikan field).
 *
 * password, joinedAt, avatarUrl, avatarDriveFileId sengaja TIDAK ada di sini:
 * - password  → schema @default("password123") yang mengisi (alur generate akun tidak berubah)
 * - joinedAt  → schema @default(now())
 * - avatar*   → diisi lewat endpoint upload avatar, bukan saat create
 *
 * role SENGAJA diizinkan: admin yang berwenang menentukannya. Pengaman
 * eskalasi hak akses adalah guard pada rute, bukan pemblokiran field ini.
 *
 * Field wajib memakai @IsString tanpa @IsNotEmpty agar perilaku sama dengan
 * sebelumnya (string kosong tetap diterima seperti dulu); yang berubah hanya:
 * field yang benar-benar hilang kini 400 (bukan 500), dan field asing ditolak.
 */
export class CreateMemberDto {
  @IsString()
  @MaxLength(50)
  nia: string;

  @IsString()
  @MaxLength(50)
  npm: string;

  @IsString()
  @MaxLength(120)
  name: string;

  @IsString()
  @MaxLength(20)
  angkatan: string;

  @IsString()
  @MaxLength(80)
  jabatan: string;

  @IsString()
  @MaxLength(40)
  role: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
