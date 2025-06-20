import { ActiveUser } from '@/auth/decorators/current-user.decorator';
import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';
import { PaginationResult } from '@/common/interfaces/pagination-result.interface';
import { Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { GetUserTicketsQueryDto } from './dto/get-user-tickets-query.dto';
import { TicketWithDetailResponseDto } from './dto/ticket-with-detail-response.dto';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {

    constructor(
        private ticketsService: TicketsService
    ){}


    @Get()
    async getUserTickets(
        @ActiveUser() user: ActiveUserData,
        @Query() query: GetUserTicketsQueryDto
    ): Promise<PaginationResult<TicketWithDetailResponseDto>> {
        return this.ticketsService.getUserTickets(user.sub, query);
    }

    @Get(":id")
    async getUserTicketById(
        @Param("id") ticketId: number,
        @ActiveUser() user: ActiveUserData
    ): Promise<TicketWithDetailResponseDto> {
        return this.ticketsService.getUserTicketById(ticketId, user.sub);
    }

    @HttpCode(200)
    @Post(":id/cancel")
    async cancelTicket(
        @Param("id") ticketId: number,
        @ActiveUser() user: ActiveUserData
    ) {
        return this.ticketsService.cancelTicket(ticketId, user.sub);
    }
}
