import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { FinanceModule } from '../finance/finance.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GoogleDriveService } from '../documents/google-drive.service';

@Module({
  imports: [PrismaModule, FinanceModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, GoogleDriveService],
})
export class TransactionModule {}