import { EventParticipantsModule } from '@/event-participants/event-participants.module';
import { PaymentsModule } from '@/payments/payments.module';
import { TicketsModule } from '@/tickets/tickets.module';
import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventsQueryResolver } from './resolvers/events-query.resolver';
import { EventInfoResolver } from './resolvers/event-info.resolver';
import { EventResolver } from './resolvers/event.resolver';
import { EventsMutationResolver } from './resolvers/events-mutation.resolver';

@Module({
  imports: [
    EventParticipantsModule,
    TicketsModule,
    PaymentsModule,
  ],
  providers: [EventsService, EventsQueryResolver, EventInfoResolver, EventResolver, EventsMutationResolver],
  controllers: [EventsController],
  exports: [EventsService]
})
export class EventsModule {}
