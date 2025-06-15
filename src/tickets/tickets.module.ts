import { PaymentsModule } from '@/payments/payments.module';
import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';

@Module({
  providers: [TicketsService],
  exports: [TicketsService],
  imports: [
    PaymentsModule
  ]
})
export class TicketsModule {}
