import { ActiveUser } from '@/auth/decorators/current-user.decorator';
import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';
import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { EventsService } from '@/events/events.service';
import { GraphQLPaginationFormatter } from '@/pagination/formetters/graphql-pagination.formatter';
import { PrismaService } from '@/prisma/prisma.service';
import { ParseIntPipe } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { UserEventsQueryDto } from '../dto/user-events-query.dto';
import { UserDto } from '../dto/user.dto';


@Resolver()
export class UsersQueryResolver {

    constructor(
        private readonly eventsService: EventsService,
        private readonly prismaService: PrismaService,
        private readonly graphqlFormetter: GraphQLPaginationFormatter
    ){}


    @Query("registeredEvents")
    async registeredEvents(
        @Args("input") input: UserEventsQueryDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        const response = await this.eventsService.getEventsByOwner(user.sub,input); 
        return this.graphqlFormetter.format(response);
    }

    @Query("userEventById")
    async getUserEventById(
        @Args("id", ParseIntPipe) id: number,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.eventsService.getUserEventById(user.sub,id,{}); 
    }

    @Query("user")
    async user(
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
