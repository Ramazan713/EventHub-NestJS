import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/auth/current-user.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { TokenPayload } from '@/auth/token-payload.interface';
import { UsersService } from './users.service';
import { EventParticipantsService } from '@/event-participants/event-participants.service';
import { EventsService } from '@/events/events.service';

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
        @CurrentUser() user: TokenPayload
    ){
        return this.eventParticipantsService.getUserParticipants(user.sub)
    }

    @Get("events")
    getEvents(
        @CurrentUser() user: TokenPayload
    ){
        return this.eventService.getUserEvents(user.sub)
    }
}
