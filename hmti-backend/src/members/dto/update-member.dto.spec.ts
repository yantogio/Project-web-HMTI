import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateMemberDto } from './update-member.dto';

describe('UpdateMemberDto', () => {
  it('menerima payload edit yang valid (hanya field yang boleh diubah)', async () => {
    const dto = plainToInstance(UpdateMemberDto, {
      npm: '2110512001',
      name: 'Budi Santoso',
      angkatan: '2021',
      jabatan: 'Anggota',
      role: 'anggota',
      status: 'Aktif',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('menolak email yang formatnya tidak valid', async () => {
    const dto = plainToInstance(UpdateMemberDto, { email: 'bukan-email' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('mem-validasi payload parsial (edit sebagian field) tanpa error', async () => {
    const dto = plainToInstance(UpdateMemberDto, { status: 'Nonaktif' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
