import { Module } from '@nestjs/common';
import { DraftEventsService } from './draft-events.service';
import { DraftEventsController } from './draft-events.controller';
import { DraftEventsQueryResolver } from './resolvers/draft-events-query.resolver';
import { DraftEventResolver } from './resolvers/draft-event.resolver';
import { DraftEventsMutationResolver } from './resolvers/draft-events-mutation.resolver';

@Module({
  providers: [DraftEventsService, DraftEventsQueryResolver, DraftEventResolver, DraftEventsMutationResolver],
  controllers: [DraftEventsController],
  exports: [
    DraftEventsService
  ]
})
export class DraftEventsModule {}
