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


@Resolver()
export class EventsQueryResolver {

    constructor(
        private readonly eventsService: EventsService,
        private readonly ticketsService: TicketsService
    ) {}

    @Auth(AuthType.None)
    @Query("publicEvents")
    async getPublicEvents(
        @Args("input") input: PublicEventsQueryDto,
    ) {
        const results = await this.eventsService.getPublicEvents(input);
        return results.data;
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
        return this.ticketsService.getEventTickets(eventId, user.sub,input);
    }

}
