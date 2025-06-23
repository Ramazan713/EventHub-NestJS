import { DraftEventsModule } from '@/draft-events/draft-events.module';
import { EventsModule } from '@/events/events.module';
import { Module } from '@nestjs/common';
import { OrganizersController } from './organizers.controller';
import { OrganizerResolver } from './resolvers/organizer.resolver';
import { OrganizersQueryResolver } from './resolvers/organizers-query.resolver';

@Module({
  controllers: [OrganizersController],
  imports: [
    EventsModule,
    DraftEventsModule
  ],
  providers: [OrganizersQueryResolver, OrganizerResolver]
})
export class OrganizersModule {}
