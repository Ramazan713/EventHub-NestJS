import { Auth } from '@/auth/decorators/auth.decorator';
import { AuthType } from '@/auth/enums/auth-type.enum';
import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { EventsService } from '@/events/events.service';
import { PrismaService } from '@/prisma/prisma.service';
import { UserDto } from '@/users/dto/user.dto';
import { ParseIntPipe } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { OrganizerEventsQueryDto } from '../dto/organizer-events-query.dto';

@Auth(AuthType.None)
@Resolver()
export class OrganizersQueryResolver {


    constructor(
        private readonly eventsService: EventsService,
        private readonly prismaService: PrismaService
    ){}

    @Query("createdEvents")
    async createdEvents(
        @Args("input") input: OrganizerEventsQueryDto
    ) {
        const items = await this.eventsService.getEventsByOwner(1,input);
        return items.data
    }

    @Query("organizerEventById")
    async getOrganizerEventById(
        @Args("id", ParseIntPipe) id: number
    ) {
        return this.eventsService.getEventByOwnerId(1, id)
    }

    @Query("organizer")
    async getOrganizer() {
        const user = await this.prismaService.user.findFirst({
            where: {
                id: 1
            }
        })
        return mapToDto(UserDto, user)
    }
}
