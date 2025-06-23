import { Module } from '@nestjs/common';
import { EventParticipantsService } from './event-participants.service';
import { EventParticipantResolver } from './resolvers/event-participant.resolver';
import { EventParticipantsQueryResolver } from './resolvers/event-participants-query.resolver';

@Module({
  providers: [
    EventParticipantsService, 
    EventParticipantsQueryResolver,
    EventParticipantResolver
  ],
  exports: [EventParticipantsService]
})
export class EventParticipantsModule {}
