import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { EventParticipantsModule } from '@/event-participants/event-participants.module';
import { EventsModule } from '@/events/events.module';
import { UsersQueryResolver } from './resolvers/users-query.resolver';
import { UserResolver } from './resolvers/user.resolver';
import { TicketsModule } from '@/tickets/tickets.module';

@Module({
  imports: [
    EventParticipantsModule,
    EventsModule,
    TicketsModule
  ],
  providers: [UsersService, UsersQueryResolver, UserResolver],
  exports: [UsersService],
  controllers: [UsersController]
})
export class UsersModule {}
