import { Auth } from '@/auth/decorators/auth.decorator';
import { AuthType } from '@/auth/enums/auth-type.enum';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { ParseIntPipe } from '@nestjs/common';
import { EventParticipantsService } from '../event-participants.service';

@Auth(AuthType.None)
@Resolver()
export class EventParticipantsQueryResolver {

    constructor(
        private readonly eventParticipantsService: EventParticipantsService
    ){}

    @Query("participants")
    async getEventParticipants(
        @Args("eventId", ParseIntPipe) eventId: number
    ) {
        const participants = await this.eventParticipantsService.getRegisteredParticipants(eventId, 1, {});
        return participants.data;
    }
}
