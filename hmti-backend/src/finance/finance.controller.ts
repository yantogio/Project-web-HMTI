import { Controller, Get, Post, Body, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { FinanceConfigService } from './finance-config.service';
import { DuesService } from './dues.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UpdateFinanceConfigDto } from './dto/update-finance-config.dto';

@Controller('finance')
export class FinanceController {
  constructor(
    private configService: FinanceConfigService,
    private duesService: DuesService
  ) {}

  // 1. Ambil Konfigurasi
  @Get('config')
  @UseGuards(JwtAuthGuard)
  getConfig() {
    return this.configService.getActiveConfig();
  }

  // 2. Update Konfigurasi (Hanya Bendahara)
  @Post('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('bendahara')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  updateConfig(@Body() data: UpdateFinanceConfigDto) {
    return this.configService.updateConfig(data);
  }

  // 3. Cek Status Generate Tagihan (untuk banner notifikasi)
  @Get('generate-status')
  @UseGuards(JwtAuthGuard)
  getGenerateStatus(@Query('period') period: string) {
    return this.duesService.getGenerateStatus(period);
  }

  // 4. Generate Tagihan Bulanan (Manual Trigger — Bendahara & Ketum)
  @Post('generate-dues')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ketum', 'bendahara')
  generateDues(@Body() body: { period: string, month: number, year: number }) {
    return this.duesService.generateMonthlyDues(body.period, body.month, body.year);
  }
}
