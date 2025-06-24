import { Auth } from '@/auth/decorators/auth.decorator';
import { ActiveUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { AuthType } from '@/auth/enums/auth-type.enum';
import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';
import { EventInfoDto } from '@/common/dto/event-info.dto';
import { EventParticipantsService } from '@/event-participants/event-participants.service';
import { RestPaginationFormatter } from '@/pagination/formetters/rest-pagination.formatter';
import { RestPaginationResult } from '@/pagination/interfaces/rest-pagination-result.interface';
import { TicketsService } from '@/tickets/tickets.service';
import { Controller, Get, Headers, HttpCode, Param, ParseIntPipe, Post, Query, RawBodyRequest, Req } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { EventDto } from './dto/event.dto';
import { GetEventParticipantQueryDto } from './dto/get-event-participant-query.dto';
import { GetEventTicketsQueryDto } from './dto/get-event-tickets-query.dto';
import { PublicEventQueryDto } from './dto/public-event-query.dto';
import { PublicEventsQueryDto } from './dto/public-events-query.dto';
import { EventsService } from './events.service';



@Controller('events')
export class EventsController {

    constructor(
        private readonly eventsService: EventsService,
        private readonly eventParticipantsService: EventParticipantsService,
        private readonly ticketsService: TicketsService,
        private readonly restFormatter: RestPaginationFormatter
    ){}


    @Auth(AuthType.None)
    @Get()
    async getEvents(
        @Query() query: PublicEventsQueryDto
    ): Promise<RestPaginationResult<EventInfoDto>> {
        const response = await this.eventsService.getPublicEvents(query);
        return this.restFormatter.format(response);
    }

    @Auth(AuthType.None)
    @Get(":id")
    async getEventId(
        @Param("id", ParseIntPipe) eventId: number,
        @Query() query: PublicEventQueryDto
    ) {
        return this.eventsService.getPublicEventById(eventId, query);
    }

    @Roles(Role.ORGANIZER, Role.ADMIN)
    @HttpCode(200)
    @Post(":id/cancel")
    async cancelEvent(
        @ActiveUser() user: ActiveUserData,
        @Param("id", ParseIntPipe) eventId: number
    ): Promise<EventDto> {
        return this.eventsService.cancelEvent(user.sub, eventId);
    }
    
    @HttpCode(200)
    @Post(":id/register")
    async registerEvent(
        @ActiveUser() user: ActiveUserData,
        @Param("id") eventId: number
    ){
        return this.eventParticipantsService.register(eventId, user.sub);
    }

    @HttpCode(200)
    @Post(":id/unregister")
    async unregisterEvent(
        @ActiveUser() user: ActiveUserData,
        @Param("id") eventId: number
    ){
        return this.eventParticipantsService.unregister(eventId, user.sub);
    }

    @Roles(Role.ORGANIZER, Role.ADMIN)
    @Get(":id/participants")
    async getParticipants(
        @ActiveUser() user: ActiveUserData,
        @Param("id") eventId: number,
        @Query() query: GetEventParticipantQueryDto
    ){
        const response = await this.eventParticipantsService.getRegisteredParticipants(eventId, user.sub, query);
        return this.restFormatter.format(response);
    }

    @HttpCode(201)
    @Post(":id/tickets")
    async createTicket(
        @ActiveUser() user: ActiveUserData,
        @Param("id") eventId: number
    ){
        return this.ticketsService.createTicket(eventId, user.sub);
    }

    @Roles(Role.ORGANIZER, Role.ADMIN)
    @Get(":id/tickets")
    async getTickets(
        @ActiveUser() user: ActiveUserData,
        @Param("id") eventId: number,
        @Query() query: GetEventTicketsQueryDto
    ){
        const response = await this.ticketsService.getEventTickets(eventId, user.sub, query);
        return this.restFormatter.format(response);
    }

    @Auth(AuthType.None)
    @HttpCode(200)
    @Post("webhook")
    async handlePayment(
        @Headers() headers: Record<string, string>,
        @Req() req: RawBodyRequest<Request>
    ){
        return this.ticketsService.handlePayment({body: req.rawBody, headers})
    }
}
