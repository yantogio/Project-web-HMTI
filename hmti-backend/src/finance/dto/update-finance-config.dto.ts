import { IsInt, Min, Max } from 'class-validator';

/**
 * DTO untuk update konfigurasi keuangan dari frontend.
 * Frontend bisa mengatur: jumlah iuran (dues), denda keterlambatan (lateFee),
 * tanggal jatuh tempo (dueDay), dan tanggal terakhir pembayaran (finalDay).
 */
export class UpdateFinanceConfigDto {
  /** Jumlah iuran per bulan (rupiah) */
  @IsInt()
  @Min(0, { message: 'duesAmount tidak boleh negatif' })
  duesAmount: number;

  /** Denda keterlambatan (rupiah) */
  @IsInt()
  @Min(0, { message: 'lateFee tidak boleh negatif' })
  lateFee: number;

  /** Tanggal jatuh tempo (1-31) */
  @IsInt()
  @Min(1, { message: 'dueDay harus antara 1-31' })
  @Max(31, { message: 'dueDay harus antara 1-31' })
  dueDay: number;

  /** Tanggal terakhir pembayaran (1-31) */
  @IsInt()
  @Min(1, { message: 'finalDay harus antara 1-31' })
  @Max(31, { message: 'finalDay harus antara 1-31' })
  finalDay: number;
}
