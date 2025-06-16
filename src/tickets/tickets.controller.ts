import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { User } from '@prisma/client';
import { CurrentUser } from '@/auth/current-user.decorator';
import { TokenPayload } from '@/auth/token-payload.interface';

@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {

    constructor(
        private ticketsService: TicketsService
    ){}

    @HttpCode(200)
    @Post(":id/cancel")
    async cancelTicket(
        @Param("id") ticketId: number,
        @CurrentUser() user: TokenPayload
    ) {
        return this.ticketsService.cancelTicket(ticketId, user.sub);
    }
}
