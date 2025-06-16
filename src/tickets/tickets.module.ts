import { PaymentsModule } from '@/payments/payments.module';
import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';

@Module({
  providers: [TicketsService],
  exports: [TicketsService],
  imports: [
    PaymentsModule
  ],
  controllers: [TicketsController]
})
export class TicketsModule {}
