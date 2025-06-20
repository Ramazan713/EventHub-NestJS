import { PaymentsModule } from '@/payments/payments.module';
import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  providers: [TicketsService],
  exports: [TicketsService],
  imports: [
    PaymentsModule,
  ],
  controllers: [TicketsController]
})
export class TicketsModule {}
