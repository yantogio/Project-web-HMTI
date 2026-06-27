import {
  Controller, Get, Post, Body, UseGuards, Request,
  UseInterceptors, UploadedFile, Query, Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.transactionsService.findAll();
  }

  @Get('report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('bendahara')
  async downloadReport(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('format') format: 'excel' | 'word',
    @Res() res: Response,
  ) {
    const buffer = await this.transactionsService.generateReport(from, to, format ?? 'excel');
    const ext = format === 'word' ? 'docx' : 'xlsx';
    const contentType = format === 'word'
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.setHeader('Content-Disposition', `attachment; filename="Laporan-Keuangan-${from}-${to}.${ext}"`);
    res.setHeader('Content-Type', contentType);
    res.send(buffer);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('bendahara')
  @UseInterceptors(FileInterceptor('proof', { limits: { fileSize: 5 * 1024 * 1024 } }))
  create(
    @Request() req,
    @Body() data: any,
    @UploadedFile() proof?: Express.Multer.File,
  ) {
    return this.transactionsService.create(data, req.user.nia, proof);
  }
}
