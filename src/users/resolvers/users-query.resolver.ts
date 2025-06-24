import { Auth } from '@/auth/decorators/auth.decorator';
import { AuthType } from '@/auth/enums/auth-type.enum';
import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { EventsService } from '@/events/events.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ParseIntPipe } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { UserEventsQueryDto } from '../dto/user-events-query.dto';
import { UserDto } from '../dto/user.dto';

@Auth(AuthType.None)
@Resolver()
export class UsersQueryResolver {

    constructor(
        private readonly eventsService: EventsService,
        private readonly prismaService: PrismaService
    ){}


    @Query("registeredEvents")
    async registeredEvents(
        @Args("input") input: UserEventsQueryDto
    ) {
        const items = await this.eventsService.getEventsByOwner(1,input); 
        return items.data
    }

    @Query("userEventById")
    async getUserEventById(
        @Args("id", ParseIntPipe) id: number,
    ) {
        return this.eventsService.getUserEventById(1,id,{}); 
    }

    @Query("user")
    async user() {
        const user = await this.prismaService.user.findFirst({
            where: {
                id: 1
            }
        })
        return mapToDto(UserDto, user)
    }
}
