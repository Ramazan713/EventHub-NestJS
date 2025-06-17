import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { EventParticipantsModule } from '@/event-participants/event-participants.module';
import { EventsModule } from '@/events/events.module';

@Module({
  imports: [
    EventParticipantsModule,
    EventsModule
  ],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController]
})
export class UsersModule {}
