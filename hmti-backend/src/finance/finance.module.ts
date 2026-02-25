import { Module } from '@nestjs/common';
import { FinanceConfigService } from './finance-config.service';
import { DuesService } from './dues.service';
import { FinanceController } from './finance.controller'; // Kita buat setelah ini
import { DuesController } from './dues.controller';       // Kita buat setelah ini
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FinanceController, DuesController],
  providers: [FinanceConfigService, DuesService],
  exports: [DuesService], 
})
export class FinanceModule {}