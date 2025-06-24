import { EventsService } from '@/events/events.service';
import { User } from '@/graphql-types';
import { GraphQLPaginationFormatter } from '@/pagination/formetters/graphql-pagination.formatter';
import { PrismaService } from '@/prisma/prisma.service';
import { TicketsService } from '@/tickets/tickets.service';
import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { UserEventsQueryDto } from '../dto/user-events-query.dto';
import { GetUserTicketsQueryDto } from '@/tickets/dto/get-user-tickets-query.dto';

@Resolver("User")
export class UserResolver {

    constructor(
        private readonly ticketsService: TicketsService,
        private readonly eventsService: EventsService,
        private readonly graphqlFormetter: GraphQLPaginationFormatter
    ){}

    @ResolveField("registeredEvents")
    async getResisteredEvents(
        @Parent() user: User,
        @Args("input") input: UserEventsQueryDto
    ) {
        const response = await this.eventsService.getUserEvents(user.id, input); 
        return this.graphqlFormetter.format(response);
    }

    @ResolveField("tickets")
    async getTickets(
        @Parent() user: User,
        @Args("input") input: GetUserTicketsQueryDto
    ) {
        const response = await this.ticketsService.getUserTickets(user.id, input);
        return this.graphqlFormetter.format(response);
    }
}
