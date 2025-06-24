import { ActiveUser } from '@/auth/decorators/current-user.decorator';
import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';
import { EventParticipantsService } from '@/event-participants/event-participants.service';
import { EventsService } from '@/events/events.service';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetUserParticipantQueryDto } from './dto/get-user-participant-query.dto';
import { UserEventsQueryDto } from './dto/user-events-query.dto';
import { UsersService } from './users.service';
import { UserEventQueryDto } from './dto/user-event.query.dto';
import { RestPaginationFormatter } from '@/pagination/formetters/rest-pagination.formatter';


@Controller('users')
export class UsersController {

    constructor(
        private readonly usersService: UsersService,
        private readonly eventParticipantsService: EventParticipantsService,
        private readonly eventService: EventsService,
        private readonly restFormatter: RestPaginationFormatter
    ){}


    @Get("me")
    me(
        @ActiveUser() user: ActiveUserData
    ){
        return this.usersService.findUserByEmail(user.email)
    }

    @Get("participants")
    async getParticipants(
        @ActiveUser() user: ActiveUserData,
        @Query() query: GetUserParticipantQueryDto
    ){
        const response = await this.eventParticipantsService.getUserParticipants(user.sub, query)
        return this.restFormatter.format(response)
    }

    @Get("events")
    async getEvents(
        @ActiveUser() user: ActiveUserData,
        @Query() query: UserEventsQueryDto
    ){
        const response = await this.eventService.getUserEvents(user.sub, query)
        return this.restFormatter.format(response)
    }

    @Get("events/:id")
    getEventById(
        @ActiveUser() user: ActiveUserData,
        @Param('id') id: number,
        @Query() query: UserEventQueryDto
    ){
        return this.eventService.getUserEventById(user.sub, id, query)
    }
}
