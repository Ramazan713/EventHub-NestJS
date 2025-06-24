import { Auth } from '@/auth/decorators/auth.decorator';
import { AuthType } from '@/auth/enums/auth-type.enum';
import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { EventsService } from '@/events/events.service';
import { PrismaService } from '@/prisma/prisma.service';
import { UserDto } from '@/users/dto/user.dto';
import { ParseIntPipe } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { OrganizerEventsQueryDto } from '../dto/organizer-events-query.dto';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ActiveUser } from '@/auth/decorators/current-user.decorator';
import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';

@Roles(Role.ORGANIZER, Role.ADMIN)
@Resolver()
export class OrganizersQueryResolver {


    constructor(
        private readonly eventsService: EventsService,
        private readonly prismaService: PrismaService
    ){}

    @Query("createdEvents")
    async createdEvents(
        @Args("input") input: OrganizerEventsQueryDto,
        @ActiveUser() user: ActiveUserData
    ) {
        const items = await this.eventsService.getEventsByOwner(user.sub,input);
        return items.data
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
