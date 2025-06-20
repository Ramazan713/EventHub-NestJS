import { ActiveUser } from '@/auth/decorators/current-user.decorator';
import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';
import { EventParticipantsService } from '@/event-participants/event-participants.service';
import { EventsService } from '@/events/events.service';
import { Controller, Get, Query } from '@nestjs/common';
import { GetUserEventsQueryDto } from './dto/get-user-events-query.dto';
import { GetUserParticipantQueryDto } from './dto/get-user-participant-query.dto';
import { UsersService } from './users.service';


@Controller('users')
export class UsersController {

    constructor(
        private usersService: UsersService,
        private eventParticipantsService: EventParticipantsService,
        private eventService: EventsService
    ){}


    @Get("me")
    me(
        @ActiveUser() user: ActiveUserData
    ){
        return this.usersService.findUserByEmail(user.email)
    }

    @Get("participants")
    getParticipants(
        @ActiveUser() user: ActiveUserData,
        @Query() query: GetUserParticipantQueryDto
    ){
        return this.eventParticipantsService.getUserParticipants(user.sub, query)
    }

    @Get("events")
    getEvents(
        @ActiveUser() user: ActiveUserData,
        @Query() query: GetUserEventsQueryDto
    ){
        return this.eventService.getUserEvents(user.sub, query)
    }
}
