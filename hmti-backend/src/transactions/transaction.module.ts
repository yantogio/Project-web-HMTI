import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { FinanceModule } from '../finance/finance.module'; 
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, FinanceModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionModule {}