import { ActiveUser } from '@/auth/decorators/current-user.decorator';
import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';
import { Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { GetUserTicketsQueryDto } from './dto/get-user-tickets-query.dto';
import { TicketWithDetailResponseDto } from './dto/ticket-with-detail-response.dto';
import { TicketsService } from './tickets.service';
import { RestPaginationResult } from '@/pagination/interfaces/rest-pagination-result.interface';
import { RestPaginationFormatter } from '@/pagination/formetters/rest-pagination.formatter';

@Controller('tickets')
export class TicketsController {

    constructor(
        private readonly ticketsService: TicketsService,
        private readonly restFormatter: RestPaginationFormatter
    ){}


    @Get()
    async getUserTickets(
        @ActiveUser() user: ActiveUserData,
        @Query() query: GetUserTicketsQueryDto
    ): Promise<RestPaginationResult<TicketWithDetailResponseDto>> {
        const result = await this.ticketsService.getUserTickets(user.sub, query);
        return this.restFormatter.format(result);
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
