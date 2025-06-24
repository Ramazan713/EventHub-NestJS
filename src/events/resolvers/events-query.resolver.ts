import { Auth } from '@/auth/decorators/auth.decorator';
import { AuthType } from '@/auth/enums/auth-type.enum';
import { TicketsService } from '@/tickets/tickets.service';
import { ParseIntPipe } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { GetEventTicketsQueryDto } from '../dto/get-event-tickets-query.dto';
import { PublicEventsQueryDto } from '../dto/public-events-query.dto';
import { EventsService } from '../events.service';
import { Role } from '@prisma/client';
import { Roles } from '@/auth/decorators/roles.decorator';
import { ActiveUser } from '@/auth/decorators/current-user.decorator';
import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';
import { GraphQLPaginationFormatter } from '@/pagination/formetters/graphql-pagination.formatter';


@Resolver()
export class EventsQueryResolver {

    constructor(
        private readonly eventsService: EventsService,
        private readonly ticketsService: TicketsService,
        private readonly graphqlFormetter: GraphQLPaginationFormatter
    ) {}

    @Auth(AuthType.None)
    @Query("publicEvents")
    async getPublicEvents(
        @Args("input") input: PublicEventsQueryDto,
    ) {
        const response = await this.eventsService.getPublicEvents(input);
        return this.graphqlFormetter.format(response);
    }

    @Auth(AuthType.None)
    @Query("publicEventById")
    async getPublicEventById(
        @Args("id") id: number,
    ) {
        return this.eventsService.getPublicEventById(id, {});
    }

    @Roles(Role.ORGANIZER, Role.ADMIN)
    @Query("eventTickets")
    async getEventTickets(
        @Args("eventId", ParseIntPipe) eventId: number,
        @Args("input") input: GetEventTicketsQueryDto,
        @ActiveUser() user: ActiveUserData
    ) {
        const response = await this.ticketsService.getEventTickets(eventId, user.sub, input);
        return this.graphqlFormetter.format(response);
    }

}
