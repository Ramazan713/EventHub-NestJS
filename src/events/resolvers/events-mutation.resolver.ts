import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { EventsService } from '../events.service';
import { TicketsService } from '@/tickets/tickets.service';
import { ActiveUser } from '@/auth/decorators/current-user.decorator';
import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';
import { Param, ParseIntPipe } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '@/auth/decorators/roles.decorator';
import { EventParticipantsService } from '@/event-participants/event-participants.service';

@Resolver()
export class EventsMutationResolver {

    constructor(
        private readonly eventsService: EventsService,
        private readonly eventParticipantsService: EventParticipantsService
    ) {}

    @Roles(Role.ORGANIZER, Role.ADMIN)
    @Mutation("cancelEvent")
    async cancelEvent(
        @ActiveUser() user: ActiveUserData, 
        @Args("id", ParseIntPipe) eventId: number
    ): Promise<any> {
        return this.eventsService.cancelEvent(user.sub, eventId);
    }

    @Mutation("registerEvent")
    async registerEvent(
        @ActiveUser() user: ActiveUserData, 
        @Args("id", ParseIntPipe) eventId: number
    ): Promise<any> {
        await this.eventParticipantsService.register(eventId, user.sub);
        return true
    }

    @Mutation("unregisterEvent")
    async unregisterEvent(
        @ActiveUser() user: ActiveUserData, 
        @Args("id", ParseIntPipe) eventId: number
    ): Promise<any> {
        await this.eventParticipantsService.unregister(eventId, user.sub);
        return true
    }
}
