import { Module } from '@nestjs/common';
import { EventParticipantsService } from './event-participants.service';

@Module({
  providers: [EventParticipantsService],
  exports: [EventParticipantsService]
})
export class EventParticipantsModule {}
