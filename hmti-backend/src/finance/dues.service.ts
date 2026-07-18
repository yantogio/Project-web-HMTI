import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

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

  async getMemberArrears(memberNia: string) {
    const member = await this.prisma.member.findUnique({ where: { nia: memberNia } });
    if (!member || member.status !== 'Aktif') {
      return {
        hasArrears: false,
        unpaidMonths: 0,
        totalRemaining: 0,
        periods: []
      };
    }

    const dues = await this.prisma.dues.findMany({
      where: { memberNia },
      orderBy: [{ year: 'asc' }, { month: 'asc' }]
    });

    if (!dues.length) {
      return {
        hasArrears: false,
        unpaidMonths: 0,
        totalRemaining: 0,
        periods: []
      };
    }

    const unpaidMonths = dues.filter(item => (item.amountDue || 0) - Math.min(item.amountPaid || 0, item.amountDue || 0) > 0).length;
    const totalRemaining = dues.reduce((sum, item) => {
      const amountDue = item.amountDue || 0;
      const amountPaid = Math.min(item.amountPaid || 0, amountDue);
      return sum + Math.max(0, amountDue - amountPaid);
    }, 0);
    const totalCredit = dues.reduce((sum, item) => sum + (item.creditBalance || 0), 0);
    const periods = dues.filter(item => (item.amountDue || 0) - Math.min(item.amountPaid || 0, item.amountDue || 0) > 0).map(item => item.period);

    return {
      hasArrears: totalRemaining > 0 && totalCredit === 0,
      unpaidMonths,
      totalRemaining,
      periods
    };
  }

  async generateDuesReport(): Promise<Buffer> {
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [currentYear, currentMonth] = currentPeriod.split('-').map(Number);

    const duesRows = await this.prisma.dues.findMany({
      where: { member: { status: 'Aktif' } },
      include: { member: { select: { nia: true, name: true, angkatan: true, jabatan: true } } },
      orderBy: [{ memberNia: 'asc' }, { year: 'asc' }, { month: 'asc' }]
    });

    const periods: string[] = [];
    const seenPeriods = new Set<string>();
    const members = await this.prisma.member.findMany({ where: { status: 'Aktif' } });

    for (const row of duesRows) {
      if (!seenPeriods.has(row.period)) {
        seenPeriods.add(row.period);
        periods.push(row.period);
      }
    }

    if (!periods.length) {
      const earliest = duesRows[0]?.period;
      if (earliest) {
        periods.push(earliest);
      }
    }

    let startYear = currentYear;
    let startMonth = currentMonth;
    if (periods.length) {
      const [firstYear, firstMonth] = periods[0].split('-').map(Number);
      startYear = firstYear;
      startMonth = firstMonth;
    }

    const periodSequence = [] as string[];
    let year = startYear;
    let month = startMonth;
    while (true) {
      periodSequence.push(`${year}-${String(month).padStart(2, '0')}`);
      if (year === currentYear && month === currentMonth) break;
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }

    const rows = members.map(member => {
      const rowValues: Record<string, string | number> = {
        nia: member.nia,
        nama: member.name,
        angkatan: member.angkatan,
        jabatan: member.jabatan
      };
      const memberRows = duesRows.filter(item => item.memberNia === member.nia);
      const memberMap = new Map(memberRows.map(item => [item.period, item]));

      periodSequence.forEach(period => {
        const dues = memberMap.get(period);
        if (!dues) {
          rowValues[period] = 'Belum Bayar';
          return;
        }

        const remaining = Math.max(0, (dues.amountDue || 0) - Math.min(dues.amountPaid || 0, dues.amountDue || 0));
        const paidAmount = Math.min(dues.amountPaid || 0, dues.amountDue || 0);
        const labels = [] as string[];
        if (paidAmount > 0) labels.push(`Dibayar ${paidAmount}`);
        if (remaining > 0) labels.push('Belum Bayar');
        if (dues.lateFeeApplied) labels.push('Denda');
        if ((dues.creditBalance || 0) > 0) labels.push('Lebih Bayar');
        rowValues[period] = labels.join(' | ') || 'Belum Bayar';
      });

      const totalPaid = memberRows.reduce((sum, item) => sum + Math.min(item.amountPaid || 0, item.amountDue || 0), 0);
      const totalRemaining = memberRows.reduce((sum, item) => sum + Math.max(0, (item.amountDue || 0) - Math.min(item.amountPaid || 0, item.amountDue || 0)), 0);
      rowValues.totalPaid = totalPaid;
      rowValues.totalRemaining = totalRemaining;
      return rowValues;
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Laporan Uang Kas');

    const borderStyle: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FF999999' } };
    const allBorders = { top: borderStyle, left: borderStyle, bottom: borderStyle, right: borderStyle };
    const rupiah = (n: number) => n === 0 ? '-' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    sheet.mergeCells('A1:G1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Laporan Uang Kas HMTI — Periode ${periodSequence[0]} s/d ${periodSequence[periodSequence.length - 1]}`;
    titleCell.font = { bold: true, size: 13 };
    titleCell.alignment = { horizontal: 'center' };
    sheet.getRow(1).height = 24;

    const headers = ['NIA', 'Nama', 'Angkatan', 'Jabatan', ...periodSequence, 'Total Dibayar', 'Total Sisa'];
    const headerRow = sheet.getRow(3);
    headerRow.values = headers;
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 18;
    headerRow.eachCell(cell => {
      cell.border = allBorders;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F7' } };
    });

    sheet.columns = [
      { key: 'nia', width: 12 },
      { key: 'nama', width: 22 },
      { key: 'angkatan', width: 12 },
      { key: 'jabatan', width: 18 },
      ...periodSequence.map(() => ({ key: 'period', width: 24 })),
      { key: 'totalPaid', width: 16 },
      { key: 'totalRemaining', width: 16 },
    ];

    rows.forEach((row, index) => {
      const values = [row.nia, row.nama, row.angkatan, row.jabatan, ...periodSequence.map(period => row[period]), row.totalPaid, row.totalRemaining];
      const dataRow = sheet.addRow(values);
      dataRow.eachCell((cell, colNumber) => {
        cell.border = allBorders;
        if (colNumber > 4 + periodSequence.length) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right' };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // 2. FUNGSI CEK STATUS GENERATE (Untuk notifikasi banner bendahara)
  async getGenerateStatus(period: string) {
    const [yearStr, monthStr] = period.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    const config = await this.prisma.financeConfig.findFirst({ where: { isActive: true } });

    // Cek apakah tagihan bulan ini sudah di-generate
    const existingCount = await this.prisma.dues.count({ where: { period } });
    if (existingCount > 0) {
      return { generated: true, period, pendingLateFeeCount: 0 };
    }

    if (!config) {
      return { generated: false, period, pendingLateFeeCount: 0, configMissing: true };
    }

    // Hitung berapa anggota bulan lalu yang akan kena denda jika di-generate sekarang
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    const prevPeriod = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

    const now = new Date();
    const finalDateOfPrevMonth = new Date(prevYear, prevMonth - 1, config.finalDay);

    let pendingLateFeeCount = 0;
    if (now > finalDateOfPrevMonth && config.lateFee > 0) {
      pendingLateFeeCount = await this.prisma.dues.count({
        where: {
          period: prevPeriod,
          status: { in: ['UNPAID', 'PARTIAL'] },
          lateFeeApplied: false
        }
      });
    }

    return { generated: false, period, pendingLateFeeCount };
  }

  // 3. FUNGSI TERAPKAN DENDA KE SEMUA TAGIHAN YANG SUDAH LEWAT DEADLINE
  async applyPendingLateFees(): Promise<number> {
    const config = await this.prisma.financeConfig.findFirst({ where: { isActive: true } });
    if (!config || config.lateFee <= 0) return 0;

    const now = new Date();
    const pendingDues = await this.prisma.dues.findMany({
      where: {
        status: { in: ['UNPAID', 'PARTIAL'] },
        lateFeeApplied: false,
      }
    });

    let applied = 0;
    for (const dues of pendingDues) {
      const finalDate = dues.finalDate
        ? new Date(dues.finalDate)
        : new Date(dues.year, dues.month - 1, config.finalDay);

      if (now > finalDate) {
        await this.prisma.dues.update({
          where: { id: dues.id },
          data: {
            amountDue: dues.amountDue + config.lateFee,
            lateFeeApplied: true
          }
        });
        applied++;
      }
    }

    return applied;
  }

  // 4. FUNGSI GENERATE TAGIHAN BULANAN
  async generateMonthlyDues(period: string, month: number, year: number) {
    const config = await this.prisma.financeConfig.findFirst({ where: { isActive: true } });
    if (!config) throw new Error('Konfigurasi Keuangan belum diatur.');

    // Terapkan denda ke semua tagihan yang sudah lewat finalDate sebelum generate baru
    await this.applyPendingLateFees();

    const members = await this.prisma.member.findMany({ where: { status: 'Aktif' } });
    const results: { nia: string; status: string; duesId?: number }[] = [];

    for (const member of members) {
      // Skip jika tagihan periode ini sudah ada
      const existing = await this.prisma.dues.findFirst({ where: { memberNia: member.nia, period } });
      if (existing) {
        results.push({ nia: member.nia, status: 'SKIP' });
        continue;
      }

      // STEP 2: Hitung credit carryover dari bulan-bulan sebelumnya
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

      // STEP 3: Buat tagihan baru untuk bulan ini
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

  // 5. FUNGSI APLIKASI PEMBAYARAN UNTUK MEMBER: alokasikan pembayaran ke semua dues (lama dahulu)
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

    // Jika masih ada sisa pembayaran, simpan sebagai credit pada dues terbaru
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

  // 6. FUNGSI RINGKASAN STATUS SEMUA ANGGOTA
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

  // 7. FUNGSI CARI TAGIHAN (Pagination)
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
