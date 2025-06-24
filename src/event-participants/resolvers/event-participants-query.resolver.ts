import { ActiveUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';
import { ParseIntPipe } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { EventParticipantsService } from '../event-participants.service';

@Roles(Role.ORGANIZER, Role.ADMIN)
@Resolver()
export class EventParticipantsQueryResolver {

    constructor(
        private readonly eventParticipantsService: EventParticipantsService
    ){}

    @Query("participants")
    async getEventParticipants(
        @Args("eventId", ParseIntPipe) eventId: number,
        @ActiveUser() user: ActiveUserData
    ) {
        const participants = await this.eventParticipantsService.getRegisteredParticipants(eventId, user.sub, {});
        return participants.data;
    }
}
