import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventParticipantsModule } from '@/event-participants/event-participants.module';
import { TicketsModule } from '@/tickets/tickets.module';
import { PaymentsModule } from '@/payments/payments.module';

@Module({
  imports: [
    EventParticipantsModule,
    TicketsModule,
    PaymentsModule
  ],
  providers: [EventsService],
  controllers: [EventsController],
  exports: [EventsService]
})
export class EventsModule {}
