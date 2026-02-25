import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateFinanceConfigDto } from './dto/update-finance-config.dto';

@Injectable()
export class FinanceConfigService {
  constructor(private prisma: PrismaService) {}

  async getActiveConfig() {
    return this.prisma.financeConfig.findFirst({
      where: { isActive: true }
    });
  }

  async updateConfig(data: UpdateFinanceConfigDto) {
    // Non-aktifkan semua config lama
    await this.prisma.financeConfig.updateMany({
      data: { isActive: false }
    });

    // Cek apakah ada config lama
    const existingConfig = await this.prisma.financeConfig.findFirst();

    if (existingConfig) {
      return this.prisma.financeConfig.update({
        where: { id: existingConfig.id },
        data: { ...data, isActive: true }
      });
    } else {
      return this.prisma.financeConfig.create({
        data: { ...data, isActive: true },
      });
    }
  }
}