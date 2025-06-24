import { ActiveUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';
import { ParseIntPipe } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { EventParticipantsService } from '../event-participants.service';
import { GraphQLPaginationFormatter } from '@/pagination/formetters/graphql-pagination.formatter';
import { PaginationQueryDto } from '@/pagination/dto/pagination-query.dto';

@Roles(Role.ORGANIZER, Role.ADMIN)
@Resolver()
export class EventParticipantsQueryResolver {

    constructor(
        private readonly eventParticipantsService: EventParticipantsService,
        private readonly graphqlFormetter: GraphQLPaginationFormatter
    ){}

    @Query("participants")
    async getEventParticipants(
        @Args("eventId", ParseIntPipe) eventId: number,
        @Args("input") input: PaginationQueryDto,
        @ActiveUser() user: ActiveUserData
    ) {
        const response = await this.eventParticipantsService.getRegisteredParticipants(eventId, user.sub, input);
        return this.graphqlFormetter.format(response);
    }
}
