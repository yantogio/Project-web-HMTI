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

        const targetDues = await this.prisma.dues.findFirst({
          where: {
            memberNia: transactionData.targetNia,
            period: period,
          },
        });

        if (targetDues) {

          // 1. Update Status & Amount Paid
          const newTotalPaid = targetDues.amountPaid + Number(transactionData.amount);
          let creditAdded = 0;
          let newStatus = 'PARTIAL';
          let newCreditBalance = targetDues.creditBalance || 0;

          if (newTotalPaid > targetDues.amountDue) {
            creditAdded = newTotalPaid - targetDues.amountDue;
            newStatus = 'OVERPAID';
            newCreditBalance = (targetDues.creditBalance || 0) + creditAdded;
          } else if (newTotalPaid === targetDues.amountDue) {
            newStatus = `PAID`;
          } else {
            newStatus = 'PARTIAL';
          }

          // 2. Update Database dengan Data yang TEPAT (Tanpa Spread Operator)
          await this.prisma.dues.update({
            where: { id: targetDues.id },
            data: {
              status: newStatus,
              amountPaid: newTotalPaid,
              creditBalance: newCreditBalance,
              transactions: {
                connect: { id: createdTransaction.id }
              }
            }
          });
        }
      }

      return createdTransaction;
    } catch (error) {
      console.error('Error Transaksi:', error);
      throw new Error('Gagal menyimpan transaksi: ' + error.message);
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