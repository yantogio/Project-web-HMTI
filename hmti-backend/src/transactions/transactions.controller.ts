import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // 1. GET: Lihat Semua Transaksi
  // Siapa saja yang login boleh melihat
  @Get()
  @UseGuards(JwtAuthGuard) 
  findAll() {
    return this.transactionsService.findAll();
  }

  // 2. POST: Tambah Transaksi Baru
  // Hanya user dengan role 'bendahara' yang boleh
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('bendahara')
  create(@Request() req, @Body() data: any) {
    // req.user.nia diambil dari token JWT (siapa yang sedang login)
    return this.transactionsService.create(data, req.user.nia);
  }
}