import { Module } from '@nestjs/common';
import { DraftEventsService } from './draft-events.service';
import { DraftEventsController } from './draft-events.controller';

@Module({
  providers: [DraftEventsService],
  controllers: [DraftEventsController]
})
export class DraftEventsModule {}
