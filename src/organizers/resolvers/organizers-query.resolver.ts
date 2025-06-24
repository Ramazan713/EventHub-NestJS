import { ActiveUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';
import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { EventsService } from '@/events/events.service';
import { GraphQLPaginationFormatter } from '@/pagination/formetters/graphql-pagination.formatter';
import { PrismaService } from '@/prisma/prisma.service';
import { UserDto } from '@/users/dto/user.dto';
import { ParseIntPipe } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { OrganizerEventsQueryDto } from '../dto/organizer-events-query.dto';

@Roles(Role.ORGANIZER, Role.ADMIN)
@Resolver()
export class OrganizersQueryResolver {


    constructor(
        private readonly eventsService: EventsService,
        private readonly prismaService: PrismaService,
        private readonly graphqlFormetter: GraphQLPaginationFormatter
    ){}

    @Query("createdEvents")
    async createdEvents(
        @Args("input") input: OrganizerEventsQueryDto,
        @ActiveUser() user: ActiveUserData
    ) {
        const response = await this.eventsService.getEventsByOwner(user.sub,input);
        return this.graphqlFormetter.format(response);
    }

    @Query("organizerEventById")
    async getOrganizerEventById(
        @Args("id", ParseIntPipe) id: number,
        @ActiveUser() user: ActiveUserData
    ) {
        return this.eventsService.getEventByOwnerId(user.sub, id)
    }

    @Query("organizer")
    async getOrganizer(
        @ActiveUser() userData: ActiveUserData
    ) {
        const user = await this.prismaService.user.findFirst({
            where: {
                id: userData.sub
            }
        })
        return mapToDto(UserDto, user)
    }
}
