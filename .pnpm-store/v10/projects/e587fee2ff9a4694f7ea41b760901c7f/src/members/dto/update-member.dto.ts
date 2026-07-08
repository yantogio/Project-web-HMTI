import { IsOptional, IsString, IsEmail, MaxLength } from 'class-validator';

/**
 * DTO untuk update data anggota (PATCH /members/:id).
 *
 * NIA TIDAK ada di sini karena merupakan primary key (dikirim lewat URL param,
 * bukan body). Field server-managed / sensitif seperti password, joinedAt,
 * avatarUrl, avatarDriveFileId juga sengaja TIDAK diizinkan — dengan
 * ValidationPipe (whitelist + forbidNonWhitelisted) field asing akan ditolak
 * dengan 400, bukan diteruskan ke Prisma dan menyebabkan error.
 */
export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  npm?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  angkatan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  jabatan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  role?: string;

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
