import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventParticipantsModule } from '@/event-participants/event-participants.module';
import { TicketsModule } from '@/tickets/tickets.module';

@Module({
  imports: [
    EventParticipantsModule,
    TicketsModule
  ],
  providers: [EventsService],
  controllers: [EventsController]
})
export class EventsModule {}
