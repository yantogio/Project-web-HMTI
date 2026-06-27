import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { MembersModule } from './members/members.module';
import { AuthModule } from './auth/auth.module';
import { RolesGuard } from './guards/roles.guard';
import { TransactionModule } from './transactions/transaction.module';
import { FinanceModule } from './finance/finance.module';
import { DocumentsModule } from './documents/documents.module';
import { ShowcaseModule } from './showcase/showcase.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    MembersModule, AuthModule, TransactionModule, FinanceModule, DocumentsModule, ShowcaseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    RolesGuard,
  ],
  exports: [PrismaService],
})
export class AppModule {}