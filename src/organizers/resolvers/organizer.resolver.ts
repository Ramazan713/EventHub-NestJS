import { DraftEventsService } from '@/draft-events/draft-events.service';
import { EventsService } from '@/events/events.service';
import { Organizer } from '@/graphql-types';
import { GraphQLPaginationFormatter } from '@/pagination/formetters/graphql-pagination.formatter';
import { UserEventsQueryDto } from '@/users/dto/user-events-query.dto';
import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { OrganizerEventsQueryDto } from '../dto/organizer-events-query.dto';
import { PaginationQueryDto } from '@/pagination/dto/pagination-query.dto';

@Resolver("Organizer")
export class OrganizerResolver {

    constructor(
        private readonly eventsService: EventsService,
        private readonly draftEventsService: DraftEventsService,
        private readonly graphqlFormetter: GraphQLPaginationFormatter
    ){}


    @ResolveField("createdEvents")
    async getCreatedEvents(
        @Parent() organizer: Organizer,
        @Args("input") input: OrganizerEventsQueryDto
    ) {
        const response = await this.eventsService.getEventsByOwner(organizer.id, input);
        return this.graphqlFormetter.format(response);
    }

    @ResolveField("registeredEvents")
    async getRegisteredEvents(
        @Parent() organizer: Organizer,
        @Args("input") input: UserEventsQueryDto
    ) {
        const response = await this.eventsService.getUserEvents(organizer.id, input);
        return this.graphqlFormetter.format(response);
    }

    @ResolveField("draftEvents")
    async getDraftEvents(
        @Parent() organizer: Organizer,
        @Args("input") input: PaginationQueryDto
    ) {
        const response = await this.draftEventsService.getDrafts(organizer.id, input);
        return this.graphqlFormetter.format(response);
    }

}
