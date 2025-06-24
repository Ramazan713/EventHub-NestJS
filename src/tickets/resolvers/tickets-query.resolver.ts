import { Auth } from '@/auth/decorators/auth.decorator';
import { AuthType } from '@/auth/enums/auth-type.enum';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { TicketsService } from '../tickets.service';
import { ParseIntPipe } from '@nestjs/common';
import { GetUserTicketsQueryDto } from '../dto/get-user-tickets-query.dto';

@Auth(AuthType.None)
@Resolver()
export class TicketsQueryResolver {

    constructor(
        private ticketsService: TicketsService
    ){}

    @Query("tickets")
    async getTickets(
        @Args("input") input: GetUserTicketsQueryDto
    ): Promise<any[]> {
        const items = await this.ticketsService.getUserTickets(1, input);
        return items.data
    }

    @Query("ticketById")
    async getTicketById(
        @Args("id", ParseIntPipe) id: number
    ): Promise<any> {
        return this.ticketsService.getUserTicketById(id, 1, false);
    }
}
