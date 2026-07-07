import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DuesService } from '../finance/dues.service';
import { GoogleDriveService } from '../documents/google-drive.service';
import * as ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, BorderStyle, AlignmentType } from 'docx';

const PROOF_FOLDER_ID = '1nf_Pk_aOgqt_uy6iQiSn5hmQyhH90Dis';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private duesService: DuesService,
    private driveService: GoogleDriveService,
  ) {}

  async create(transactionData: any, creatorNia: string, proofFile?: Express.Multer.File) {
    try {
      let proofUrl: string | null = null;
      let proofDriveFileId: string | null = null;

      if (proofFile) {
        const uploaded = await this.driveService.uploadFile(proofFile, PROOF_FOLDER_ID);
        proofUrl = uploaded.webViewLink ?? null;
        proofDriveFileId = uploaded.id ?? null;
      }

      const createdTransaction = await this.prisma.transaction.create({
        data: {
          type: transactionData.type,
          amount: Number(transactionData.amount),
          category: transactionData.category,
          description: transactionData.description,
          subCategory: transactionData.subCategory || null,
          paymentMethod: transactionData.paymentMethod || null,
          proofUrl,
          proofDriveFileId,
          createdByNia: creatorNia,
          date: new Date(),
        },
      });

      if (transactionData.type === 'in' && transactionData.category === 'Kas Anggota') {
        if (!transactionData.targetNia) {
          throw new Error('Target NIA anggota harus diisi untuk pembayaran kas.');
        }

        const period = transactionData.period || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

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

  async generateReport(from: string, to: string, format: 'excel' | 'word'): Promise<Buffer> {
    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        date: { gte: fromDate, lte: toDate },
      },
      orderBy: { date: 'asc' },
    });

    let runningBalance = 0;
    const rows = transactions.map((t, i) => {
      if (t.type === 'in') runningBalance += t.amount;
      else runningBalance -= t.amount;

      const date = new Date(t.date);
      const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

      return {
        no: i + 1,
        tipe: t.type === 'in' ? 'Pemasukan' : 'Pengeluaran',
        tanggal: dateStr,
        kategori: t.category,
        deskripsi: t.description,
        nominalKeluar: t.type === 'out' ? t.amount : 0,
        nominalMasuk: t.type === 'in' ? t.amount : 0,
        saldo: runningBalance,
      };
    });

    if (format === 'excel') {
      return this.generateExcel(rows, from, to);
    } else {
      return this.generateWord(rows, from, to);
    }
  }

  private async generateExcel(rows: any[], from: string, to: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Laporan Keuangan');

    const rupiah = (n: number) => n === 0 ? '-' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Laporan Keuangan HMTI — Periode ${from} s/d ${to}`;
    titleCell.font = { bold: true, size: 13 };
    titleCell.alignment = { horizontal: 'center' };
    sheet.getRow(1).height = 24;

    sheet.getRow(3).values = ['No', 'Tipe', 'Tanggal & Jam', 'Kategori', 'Deskripsi', 'Nominal Keluar', 'Nominal Masuk', 'Saldo dalam Periode'];
    sheet.getRow(3).font = { bold: true };
    sheet.getRow(3).alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(3).height = 18;

    const borderStyle: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FF999999' } };
    const allBorders = { top: borderStyle, left: borderStyle, bottom: borderStyle, right: borderStyle };

    sheet.getRow(3).eachCell(cell => {
      cell.border = allBorders;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F7' } };
    });

    sheet.columns = [
      { key: 'no', width: 5 },
      { key: 'tipe', width: 13 },
      { key: 'tanggal', width: 20 },
      { key: 'kategori', width: 18 },
      { key: 'deskripsi', width: 30 },
      { key: 'nominalKeluar', width: 18 },
      { key: 'nominalMasuk', width: 18 },
      { key: 'saldo', width: 20 },
    ];

    rows.forEach(r => {
      const row = sheet.addRow([
        r.no,
        r.tipe,
        r.tanggal,
        r.kategori,
        r.deskripsi,
        r.nominalKeluar > 0 ? r.nominalKeluar : '',
        r.nominalMasuk > 0 ? r.nominalMasuk : '',
        r.saldo,
      ]);

      row.eachCell((cell, colNumber) => {
        cell.border = allBorders;
        if (colNumber >= 6) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right' };
        }
      });

      if (r.tipe === 'Pemasukan') {
        row.getCell(7).font = { color: { argb: 'FF059669' } };
      } else {
        row.getCell(6).font = { color: { argb: 'FFE11D48' } };
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private async generateWord(rows: any[], from: string, to: string): Promise<Buffer> {
    const rupiah = (n: number) => n === 0 ? '-' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    const cellBorder = {
      top: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
    };

    const makeHeaderCell = (text: string) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18 })], alignment: AlignmentType.CENTER })],
        borders: cellBorder,
        shading: { fill: 'D6E4F7' },
      });

    const makeCell = (text: string, align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, size: 18 })], alignment: align })],
        borders: cellBorder,
      });

    const headerRow = new TableRow({
      children: [
        makeHeaderCell('No'),
        makeHeaderCell('Tipe'),
        makeHeaderCell('Tanggal & Jam'),
        makeHeaderCell('Kategori'),
        makeHeaderCell('Deskripsi'),
        makeHeaderCell('Nominal Keluar'),
        makeHeaderCell('Nominal Masuk'),
        makeHeaderCell('Saldo dalam Periode'),
      ],
    });

    const dataRows = rows.map(r =>
      new TableRow({
        children: [
          makeCell(String(r.no), AlignmentType.CENTER),
          makeCell(r.tipe),
          makeCell(r.tanggal),
          makeCell(r.kategori),
          makeCell(r.deskripsi),
          makeCell(r.nominalKeluar > 0 ? rupiah(r.nominalKeluar) : '-', AlignmentType.RIGHT),
          makeCell(r.nominalMasuk > 0 ? rupiah(r.nominalMasuk) : '-', AlignmentType.RIGHT),
          makeCell(rupiah(r.saldo), AlignmentType.RIGHT),
        ],
      })
    );

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
    });

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [new TextRun({ text: `Laporan Keuangan HMTI`, bold: true, size: 28 })],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [new TextRun({ text: `Periode: ${from} s/d ${to}`, size: 22 })],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ children: [] }),
          table,
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    return buffer;
  }
}
