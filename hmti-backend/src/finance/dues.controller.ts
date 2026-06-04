import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DuesService } from './dues.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dues')
export class DuesController {
  constructor(private duesService: DuesService) {}

  // 1. Cek Status Anggota (Untuk Notifikasi Instan di Frontend)
  @Get('check-status')
  @UseGuards(JwtAuthGuard)
  checkStatus(@Query('nia') nia: string, @Query('period') period: string) {
    return this.duesService.checkMemberStatus(nia, period);
  }

  // 1.b Ringkasan Status Anggota per Membership (Akurat dan kumulatif)
  @Get('summary')
  @UseGuards(JwtAuthGuard)
  getSummary() {
    return this.duesService.getSummary();
  }

  // 2. Daftar Status Anggota (Pagination)
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: any) {
    return this.duesService.findMany(query);
  }
}