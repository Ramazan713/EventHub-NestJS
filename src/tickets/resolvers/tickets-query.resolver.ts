import { Auth } from '@/auth/decorators/auth.decorator';
import { AuthType } from '@/auth/enums/auth-type.enum';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { TicketsService } from '../tickets.service';
import { ParseIntPipe } from '@nestjs/common';
import { GetUserTicketsQueryDto } from '../dto/get-user-tickets-query.dto';
import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';
import { ActiveUser } from '@/auth/decorators/current-user.decorator';

@Resolver()
export class TicketsQueryResolver {

    constructor(
        private ticketsService: TicketsService
    ){}

    @Query("tickets")
    async getTickets(
        @Args("input") input: GetUserTicketsQueryDto,
        @ActiveUser() user: ActiveUserData,
    ): Promise<any[]> {
        const items = await this.ticketsService.getUserTickets(user.sub, input);
        return items.data
    }

    @Query("ticketById")
    async getTicketById(
        @Args("id", ParseIntPipe) id: number,
        @ActiveUser() user: ActiveUserData,
    ): Promise<any> {
        return this.ticketsService.getUserTicketById(id, user.sub, false);
    }
}
