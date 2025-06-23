import { DraftEventsService } from '@/draft-events/draft-events.service';
import { EventsService } from '@/events/events.service';
import { Organizer } from '@/graphql-types';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

@Resolver("Organizer")
export class OrganizerResolver {

    constructor(
        private readonly eventsService: EventsService,
        private readonly draftEventsService: DraftEventsService
    ){}


    @ResolveField("createdEvents")
    async getCreatedEvents(
        @Parent() organizer: Organizer
    ) {
        const items = await this.eventsService.getEventsByOwner(organizer.id, {});
        return items.data
    }

    @ResolveField("registeredEvents")
    async getRegisteredEvents(
        @Parent() organizer: Organizer
    ) {
        const items = await this.eventsService.getUserEvents(organizer.id, {});
        return items.data
    }

    @ResolveField("draftEvents")
    async getDraftEvents(
        @Parent() organizer: Organizer
    ) {
        const items = await this.draftEventsService.getDrafts(organizer.id, {});
        return items.data
    }

}
