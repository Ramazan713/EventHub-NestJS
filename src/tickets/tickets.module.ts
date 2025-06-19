import { PaymentsModule } from '@/payments/payments.module';
import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { CommonModule } from '@/common/common.module';

@Module({
  providers: [TicketsService],
  exports: [TicketsService],
  imports: [
    PaymentsModule,
    CommonModule
  ],
  controllers: [TicketsController]
})
export class TicketsModule {}
