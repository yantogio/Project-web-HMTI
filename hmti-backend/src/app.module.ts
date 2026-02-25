import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service'; 
import { MembersModule } from './members/members.module';
import { AuthModule } from './auth/auth.module';
import { RolesGuard } from './guards/roles.guard';
import { TransactionModule } from './transactions/transaction.module';
import { FinanceModule } from './finance/finance.module';

@Module({
  imports: [MembersModule, AuthModule, TransactionModule, FinanceModule],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    RolesGuard,
  ],
  exports: [PrismaService],
})
export class AppModule {}