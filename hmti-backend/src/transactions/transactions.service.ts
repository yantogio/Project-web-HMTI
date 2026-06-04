import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DuesService } from '../finance/dues.service';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService, private duesService: DuesService) { }

  async create(transactionData: any, creatorNia: string) {
    try {
      const createdTransaction = await this.prisma.transaction.create({
        data: {
          type: transactionData.type,
          amount: Number(transactionData.amount),
          category: (transactionData.category), // Trim spasi
          description: transactionData.description,
          subCategory: transactionData.subCategory || null,
          createdByNia: creatorNia,
          date: new Date(),
        },
      });

      // LOGIKA KHUSUS: Hubungkan ke Tagihan jika perlu
      if (transactionData.type === 'in' && transactionData.category === 'Kas Anggota') {

        if (!transactionData.targetNia) {
          throw new Error('Target NIA anggota harus diisi untuk pembayaran kas.');
        }

        // Tentukan periode
        const period = transactionData.period || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

        // Alokasi pembayaran ke semua dues terbuka untuk member (tanpa bergantung pada periode)
        await this.duesService.applyMemberPayment(
          transactionData.targetNia,
          Number(transactionData.amount),
          createdTransaction.id
        );
      }

      return createdTransaction;
    } catch (error) {
      console.error('Error Transaksi:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error('Gagal menyimpan transaksi: ' + errorMessage);
    }
  }

  async findAll() {
    return this.prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { name: true, role: true } },
        dues: { select: { status: true, amountDue: true } }
      }
    });
  }
}