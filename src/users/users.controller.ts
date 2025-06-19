import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/auth/current-user.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { TokenPayload } from '@/auth/token-payload.interface';
import { UsersService } from './users.service';
import { EventParticipantsService } from '@/event-participants/event-participants.service';
import { EventsService } from '@/events/events.service';
import { GetUserParticipantQueryDto } from './dto/get-user-participant-query.dto';
import { GetUserEventsQueryDto } from './dto/get-user-events-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {

    constructor(
        private usersService: UsersService,
        private eventParticipantsService: EventParticipantsService,
        private eventService: EventsService
    ){}


    @Get("me")
    me(
        @CurrentUser() user: TokenPayload
    ){
        return this.usersService.findUserByEmail(user.email)
    }

    @Get("participants")
    getParticipants(
        @CurrentUser() user: TokenPayload,
        @Query() query: GetUserParticipantQueryDto
    ){
        return this.eventParticipantsService.getUserParticipants(user.sub, query)
    }

    @Get("events")
    getEvents(
        @CurrentUser() user: TokenPayload,
        @Query() query: GetUserEventsQueryDto
    ){
        return this.eventService.getUserEvents(user.sub, query)
    }
}
