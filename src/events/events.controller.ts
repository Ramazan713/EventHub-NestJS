import { Body, Controller, Get, Headers, HttpCode, Param, ParseIntPipe, Post, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '@/auth/current-user.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { Roles } from '@/auth/roles.decorator';
import { RolesGuard } from '@/auth/roles.guard';
import { TokenPayload } from '@/auth/token-payload.interface';
import { EventDto } from './dto/event.dto';
import { EventsService } from './events.service';
import { EventParticipantsService } from '@/event-participants/event-participants.service';
import { TicketsService } from '@/tickets/tickets.service';
import { Request } from 'express';



@Controller('events')
export class EventsController {

    constructor(
        private eventsService: EventsService,
        private eventParticipantsService: EventParticipantsService,
        private ticketsService: TicketsService
    ){}

    
    @UseGuards(RolesGuard)
    @Roles(Role.ORGANIZER, Role.ADMIN)
    @UseGuards(JwtAuthGuard)
    @Get()
    async getEvents(
        @CurrentUser() user: TokenPayload
    ): Promise<EventDto[]> {
        return this.eventsService.getEvents(user.sub);
    }

   
    @UseGuards(RolesGuard)
    @Roles(Role.ORGANIZER, Role.ADMIN)
    @UseGuards(JwtAuthGuard)
    @HttpCode(200)
    @Post(":id/cancel")
    async cancelEvent(
        @CurrentUser() user: TokenPayload,
        @Param("id", ParseIntPipe) eventId: number
    ): Promise<EventDto> {
        return this.eventsService.cancelEvent(user.sub, eventId);
    }
    
    @UseGuards(JwtAuthGuard)
    @HttpCode(200)
    @Post(":id/register")
    async registerEvent(
        @CurrentUser() user: TokenPayload,
        @Param("id") eventId: number
    ){
        return this.eventParticipantsService.register(eventId, user.sub);
    }

    @UseGuards(JwtAuthGuard)
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
    @UseGuards(JwtAuthGuard)
    @Get(":id/participants")
    async getParticipants(
        @CurrentUser() user: TokenPayload,
        @Param("id") eventId: number
    ){
        return this.eventParticipantsService.getParticipants(eventId, user.sub);
    }

    @HttpCode(201)
    @UseGuards(JwtAuthGuard)
    @Post(":id/tickets")
    async createTicket(
        @CurrentUser() user: TokenPayload,
        @Param("id") eventId: number
    ){
        return this.ticketsService.createTicket(eventId, user.sub);
    }

    @HttpCode(200)
    @Post("webhook")
    async handlePayment(
        @Headers() headers: Record<string, string>,
        @Req() req: RawBodyRequest<Request>
    ){
        return this.ticketsService.handlePayment({body: req.rawBody, headers})
    }
}
