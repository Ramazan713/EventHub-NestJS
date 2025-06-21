import { Module } from '@nestjs/common';
import { OrganizersController } from './organizers.controller';
import { EventsModule } from '@/events/events.module';

@Module({
  controllers: [OrganizersController],
  imports: [
    EventsModule
  ]
})
export class OrganizersModule {}
