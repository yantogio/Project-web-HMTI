import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DuesService {
  constructor(private prisma: PrismaService) {}

  // 1. FUNGSI CEK STATUS
  async checkMemberStatus(memberNia: string, period?: string) {
    const dues = await this.prisma.dues.findMany({
      where: { memberNia }
    });

    if (!dues.length) return null;

    const totalAmountDue = dues.reduce((sum, item) => sum + (item.amountDue || 0), 0);
    const totalAmountPaid = dues.reduce((sum, item) => {
      const cappedPaid = Math.min(item.amountPaid || 0, item.amountDue || 0);
      return sum + cappedPaid;
    }, 0);
    const totalCredit = dues.reduce((sum, item) => sum + (item.creditBalance || 0), 0);
    const remaining = totalAmountDue - totalAmountPaid;

    const statusOrder = ['UNPAID', 'PARTIAL', 'PAID', 'OVERPAID'];
    let status = 'PAID';
    for (const item of dues) {
      const itemIndex = statusOrder.indexOf(item.status);
      if (itemIndex >= 0 && itemIndex < statusOrder.indexOf(status)) {
        status = item.status;
      }
    }

    if (remaining < 0 || totalCredit > 0) {
      status = 'OVERPAID';
    }

    return {
      status,
      amountDue: totalAmountDue,
      amountPaid: totalAmountPaid,
      remaining,
      creditBalance: totalCredit
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

  // 3. FUNGSI GENERATE TAGIHAN (Sederhana: buat tagihan baru tanpa carryover credit)
  async generateMonthlyDues(period: string, month: number, year: number) {
    const config = await this.prisma.financeConfig.findFirst({ where: { isActive: true }});
    if (!config) throw new Error('Konfigurasi Keuangan belum diatur.');

    const members = await this.prisma.member.findMany({ where: { status: 'Aktif' } });
    const results: { nia: string; status: string; duesId?: number }[] = [];

    for (const member of members) {
      const existing = await this.prisma.dues.findFirst({ where: { memberNia: member.nia, period } });
      if (existing) {
        results.push({ nia: member.nia, status: 'SKIP' });
        continue;
      }

      const creditRows = await this.prisma.dues.findMany({
        where: { memberNia: member.nia, creditBalance: { gt: 0 } },
        orderBy: [{ year: 'desc' }, { month: 'desc' }]
      });

      let totalCredit = 0;
      for (const row of creditRows) {
        const overpaidAmount = Math.max(0, (row.amountPaid || 0) - (row.amountDue || 0));
        if (overpaidAmount > 0) {
          await this.prisma.dues.update({
            where: { id: row.id },
            data: {
              amountPaid: row.amountDue,
              creditBalance: (row.creditBalance || 0) + overpaidAmount,
              status: 'OVERPAID'
            }
          });
          totalCredit += (row.creditBalance || 0) + overpaidAmount;
        } else {
          totalCredit += (row.creditBalance || 0);
        }
      }

      if (totalCredit > 0) {
        await this.prisma.dues.updateMany({
          where: { memberNia: member.nia, creditBalance: { gt: 0 } },
          data: { creditBalance: 0, status: 'PAID' }
        });
      }

      const paidFromCredit = Math.min(totalCredit, config.duesAmount);
      const creditBalance = Math.max(0, totalCredit - config.duesAmount);
      let status = 'UNPAID';
      if (paidFromCredit >= config.duesAmount) {
        status = creditBalance > 0 ? 'OVERPAID' : 'PAID';
      } else if (paidFromCredit > 0) {
        status = 'PARTIAL';
      }

      const newDues = await this.prisma.dues.create({
        data: {
          memberNia: member.nia,
          period,
          month,
          year,
          amountDue: config.duesAmount,
          amountPaid: paidFromCredit,
          status,
          creditBalance,
          dueDate: new Date(year, month - 1, config.dueDay),
          finalDate: new Date(year, month - 1, config.finalDay)
        }
      });

      results.push({ nia: member.nia, status: 'CREATED', duesId: newDues.id });
    }

    return results;
  }

  // 4. FUNGSI APLIKASI PEMBAYARAN UNTUK MEMBER: alokasikan pembayaran ke semua dues (lama dahulu)
  async applyMemberPayment(memberNia: string, amountPaid: number, transactionId: number) {
    let remaining = Number(amountPaid || 0);

    // Ambil semua tagihan yang belum lunas (lama -> baru)
    const openDues = await this.prisma.dues.findMany({
      where: { memberNia, status: { in: ['UNPAID', 'PARTIAL'] } },
      orderBy: [{ year: 'asc' }, { month: 'asc' }]
    });

    const appliedTo: number[] = [];

    for (const dues of openDues) {
      if (remaining <= 0) break;
      const dueLeft = (dues.amountDue || 0) - (dues.amountPaid || 0);
      if (dueLeft <= 0) continue;

      if (remaining >= dueLeft) {
        // Lunas untuk tagihan ini
        remaining -= dueLeft;
        const newAmountPaid = (dues.amountPaid || 0) + dueLeft;
        await this.prisma.dues.update({
          where: { id: dues.id },
          data: {
            amountPaid: newAmountPaid,
            status: 'PAID',
            transactions: { connect: { id: transactionId } }
          }
        });
        appliedTo.push(dues.id);
      } else {
        // Bayar sebagian
        const newAmountPaid = (dues.amountPaid || 0) + remaining;
        await this.prisma.dues.update({
          where: { id: dues.id },
          data: {
            amountPaid: newAmountPaid,
            status: 'PARTIAL',
            transactions: { connect: { id: transactionId } }
          }
        });
        appliedTo.push(dues.id);
        remaining = 0;
        break;
      }
    }

    // Jika masih ada sisa pembayaran, simpan sebagai credit pada dues terbaru (atau buat baru jika tidak ada)
    if (remaining > 0) {
      const latest = await this.prisma.dues.findFirst({ where: { memberNia }, orderBy: [{ year: 'desc' }, { month: 'desc' }] });
      if (latest) {
        const dueLeft = Math.max(0, (latest.amountDue || 0) - (latest.amountPaid || 0));
        const applyToLatest = Math.min(dueLeft, remaining);
        const newAmountPaid = (latest.amountPaid || 0) + applyToLatest;
        const leftoverCredit = remaining - applyToLatest;
        const newCredit = (latest.creditBalance || 0) + leftoverCredit;
        const newStatus = newAmountPaid >= (latest.amountDue || 0)
          ? (newCredit > 0 ? 'OVERPAID' : 'PAID')
          : 'PARTIAL';

        await this.prisma.dues.update({
          where: { id: latest.id },
          data: {
            creditBalance: newCredit,
            amountPaid: newAmountPaid,
            status: newStatus,
            transactions: { connect: { id: transactionId } }
          }
        });
        appliedTo.push(latest.id);
        remaining = 0;
      } else {
        // Tidak ada dues sama sekali: buat entry kredit untuk periode sekarang
        const now = new Date();
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const config = await this.prisma.financeConfig.findFirst({ where: { isActive: true } });
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const amountDue = config?.duesAmount ?? 0;
        const paid = Math.min(remaining, amountDue);
        const creditBalance = Math.max(0, remaining - amountDue);
        const status = paid >= amountDue ? (creditBalance > 0 ? 'OVERPAID' : 'PAID') : 'PARTIAL';
        const created = await this.prisma.dues.create({
          data: {
            memberNia,
            period,
            month,
            year,
            amountDue,
            amountPaid: paid,
            creditBalance,
            status,
            dueDate: new Date(year, month - 1, config?.dueDay ?? 10),
            finalDate: new Date(year, month - 1, config?.finalDay ?? 15),
            transactions: { connect: { id: transactionId } }
          }
        });
        appliedTo.push(created.id);
        remaining = 0;
      }
    }

    return { appliedTo, leftover: remaining };
  }

  // HELPER: Ambil 3 periode sebelumnya untuk pengecekan credit
  private getPreviousPeriod(year: number, month: number): string[] {
    const periods: string[] = [];
    let currentYear = year;
    let currentMonth = month;

    for (let i = 0; i < 3; i++) {
      currentMonth--;
      if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
      }
      const periodStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      periods.push(periodStr);
    }

    return periods;
  }

  async getSummary() {
    const dues = await this.prisma.dues.findMany({
      include: {
        member: {
          select: {
            nia: true,
            name: true,
            angkatan: true,
            jabatan: true
          }
        }
      },
      orderBy: [{ memberNia: 'asc' }, { year: 'asc' }, { month: 'asc' }]
    });

    const summaryMap = new Map<string, any>();
    const statusOrder = ['UNPAID', 'PARTIAL', 'PAID', 'OVERPAID'];

    for (const item of dues) {
      const memberNia = item.member?.nia || item.memberNia;
      const existing = summaryMap.get(memberNia) || {
        member: item.member,
        totalAmountDue: 0,
        totalAmountPaid: 0,
        remaining: 0,
        status: 'PAID',
        periodsCount: 0,
        creditBalance: 0
      };

      existing.totalAmountDue += item.amountDue;
      existing.totalAmountPaid += Math.min(item.amountPaid || 0, item.amountDue || 0);
      existing.creditBalance += item.creditBalance;
      existing.periodsCount += 1;

      const currentStatusIndex = statusOrder.indexOf(item.status);
      const existingStatusIndex = statusOrder.indexOf(existing.status);
      if (currentStatusIndex >= 0 && currentStatusIndex < existingStatusIndex) {
        existing.status = item.status;
      }

      summaryMap.set(memberNia, existing);
    }

    const summary = Array.from(summaryMap.values()).map(item => {
      const remaining = item.totalAmountDue - item.totalAmountPaid;
      return {
        ...item,
        remaining,
        status: (remaining < 0 || item.creditBalance > 0) ? 'OVERPAID' : item.status
      };
    });

    return summary;
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