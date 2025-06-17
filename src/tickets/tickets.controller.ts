import { CurrentUser } from '@/auth/current-user.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { TokenPayload } from '@/auth/token-payload.interface';
import { Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { TicketWithDetailResponseDto } from './dto/ticket-with-detail-response.dto';
import { TicketsService } from './tickets.service';

@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {

    constructor(
        private ticketsService: TicketsService
    ){}


    @Get()
    async getUserTickets(@CurrentUser() user: TokenPayload): Promise<TicketWithDetailResponseDto[]> {
        return this.ticketsService.getUserTickets(user.sub);
    }

    @Get(":id")
    async getUserTicketById(
        @Param("id") ticketId: number,
        @CurrentUser() user: TokenPayload
    ): Promise<TicketWithDetailResponseDto> {
        return this.ticketsService.getUserTicketById(ticketId, user.sub);
    }

    @HttpCode(200)
    @Post(":id/cancel")
    async cancelTicket(
        @Param("id") ticketId: number,
        @CurrentUser() user: TokenPayload
    ) {
        return this.ticketsService.cancelTicket(ticketId, user.sub);
    }
}
