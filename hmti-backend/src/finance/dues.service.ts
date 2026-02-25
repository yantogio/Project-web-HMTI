import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DuesService {
  constructor(private prisma: PrismaService) {}

  // 1. FUNGSI CEK STATUS
  async checkMemberStatus(memberNia: string, period: string) {
    const dues = await this.prisma.dues.findFirst({
      where: {
        memberNia,
        period
      }
    });

    if (!dues) return null; 

    return {
      status: dues.status,
      amountDue: dues.amountDue,
      amountPaid: dues.amountPaid,
      remaining: dues.amountDue - dues.amountPaid
    };
  }

  async processPayment(memberNia: string, period: string, amountPaid: number, transactionId: number) {
    const dues = await this.prisma.dues.findFirst({
      where: { memberNia, period }
    });

    if (!dues) {
      throw new NotFoundException('Tagihan untuk periode ini tidak ditemukan.');
    }

    const newTotalPaid = dues.amountPaid + amountPaid;
    let creditAdded = 0;
    let newStatus = 'PARTIAL';

    if (newTotalPaid > dues.amountDue) {
      creditAdded = newTotalPaid - dues.amountDue;
      newStatus = 'OVERPAID';
      dues.creditBalance = (dues.creditBalance || 0) + creditAdded;
    } else if (newTotalPaid === dues.amountDue) {
      newStatus = 'PAID';
    } else {
      dues.status = 'PARTIAL';
    }

    // PERBAIKAN INI: Update menggunakan spread (...) agar data bersih
    await this.prisma.dues.update({
      where: { id: dues.id },
      data: {
        status: newStatus,
        amountPaid: newTotalPaid,
        creditBalance: dues.creditBalance,
        transactions: {
          connect: { id: transactionId }
        }
      }
    });

    return { message: 'Pembayaran berhasil', status: newStatus, creditAdded };
  }

  // 3. FUNGSI GENERATE TAGIHAN
  async generateMonthlyDues(period: string, month: number, year: number) {
    // Cek Config (Pastikan config ada)
    const config = await this.prisma.financeConfig.findFirst({ where: { isActive: true }});
    if (!config) throw new Error('Konfigurasi Keuangan belum diatur.');

    const members = await this.prisma.member.findMany({
      where: { status: 'Aktif' }
    });

    const results: { nia: string; status: string; duesId?: number }[] = [];

    for (const member of members) {
      const existing = await this.prisma.dues.findFirst({
        where: { memberNia: member.nia, period }
      });

      if (existing) {
        results.push({ nia: member.nia, status: 'SKIP' });
        continue;
      }

      const newDues = await this.prisma.dues.create({
        data: {
          memberNia: member.nia,
          period,
          month,
          year,
          amountDue: config.duesAmount,
          status: 'UNPAID',
          dueDate: new Date(year, month, config.dueDay),
          finalDate: new Date(year, month, config.finalDay)
        }
      });

      results.push({ nia: member.nia, status: 'CREATED', duesId: newDues.id });
    }

    return results;
  }

  // 4. FUNGSI CARI TAGIHAN
  async findMany(query: any) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.member = {
        name: { contains: search }
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.dues.findMany({
        where,
        include: {
          member: { select: { nia: true, name: true, angkatan: true, jabatan: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.dues.count({ where })
    ]);

    return { data, total, page, limit };
  }
}