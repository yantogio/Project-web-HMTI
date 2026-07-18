import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { DuesService } from './dues.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';

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

  @Get('my-arrears')
  @UseGuards(JwtAuthGuard)
  getMyArrears(@Req() req: any) {
    return this.duesService.getMemberArrears(req.user.nia);
  }

  // 2. Daftar Status Anggota (Pagination)
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: any) {
    return this.duesService.findMany(query);
  }
}