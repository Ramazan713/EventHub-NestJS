import { Controller, Get, HttpCode, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '@/auth/current-user.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { Roles } from '@/auth/roles.decorator';
import { RolesGuard } from '@/auth/roles.guard';
import { TokenPayload } from '@/auth/token-payload.interface';
import { EventDto } from './dto/event.dto';
import { EventsService } from './events.service';
import { EventParticipantsService } from '@/event-participants/event-participants.service';


@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {

    constructor(
        private eventsService: EventsService,
        private eventParticipantsService: EventParticipantsService
    ){}

    @UseGuards(RolesGuard)
    @Roles(Role.ORGANIZER, Role.ADMIN)
    @Get()
    async getEvents(
        @CurrentUser() user: TokenPayload
    ): Promise<EventDto[]> {
        return this.eventsService.getEvents(user.sub);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.ORGANIZER, Role.ADMIN)
    @HttpCode(200)
    @Post(":id/cancel")
    async cancelEvent(
        @CurrentUser() user: TokenPayload,
        @Param("id", ParseIntPipe) eventId: number
    ): Promise<EventDto> {
        return this.eventsService.cancelEvent(user.sub, eventId);
    }
    
    @HttpCode(200)
    @Post(":id/register")
    async registerEvent(
        @CurrentUser() user: TokenPayload,
        @Param("id") eventId: number
    ){
        return this.eventParticipantsService.register(eventId, user.sub);
    }

    @HttpCode(200)
    @Post(":id/unregister")
    async unregisterEvent(
        @CurrentUser() user: TokenPayload,
        @Param("id") eventId: number
    ){
        return this.eventParticipantsService.unregister(eventId, user.sub);
    }

    @UseGuards(RolesGuard)
    @Roles(Role.ORGANIZER, Role.ADMIN)
    @Get(":id/participants")
    async getParticipants(
        @CurrentUser() user: TokenPayload,
        @Param("id") eventId: number
    ){
        return this.eventParticipantsService.getParticipants(eventId, user.sub);
    }

}
