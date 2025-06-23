import { EventsService } from '@/events/events.service';
import { User } from '@/graphql-types';
import { PrismaService } from '@/prisma/prisma.service';
import { TicketsService } from '@/tickets/tickets.service';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

@Resolver("User")
export class UserResolver {

    constructor(
        private readonly ticketsService: TicketsService,
        private readonly eventsService: EventsService
    ){}

    @ResolveField("registeredEvents")
    async getResisteredEvents(
        @Parent() user: User
    ) {
        const items = await this.eventsService.getUserEvents(user.id, {}); 
        return items.data
    }

    @ResolveField("tickets")
    async getTickets(
        @Parent() user: User
    ) {
        const items = await this.ticketsService.getUserTickets(user.id, {});
        return items.data
    }
}
