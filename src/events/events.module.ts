import { EventParticipantsModule } from '@/event-participants/event-participants.module';
import { PaymentsModule } from '@/payments/payments.module';
import { TicketsModule } from '@/tickets/tickets.module';
import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [
    EventParticipantsModule,
    TicketsModule,
    PaymentsModule,
  ],
  providers: [EventsService],
  controllers: [EventsController],
  exports: [EventsService]
})
export class EventsModule {}
