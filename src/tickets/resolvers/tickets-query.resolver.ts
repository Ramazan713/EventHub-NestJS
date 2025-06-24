import { ActiveUser } from '@/auth/decorators/current-user.decorator';
import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';
import { GraphQLPaginationFormatter } from '@/pagination/formetters/graphql-pagination.formatter';
import { ParseIntPipe } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { GetUserTicketsQueryDto } from '../dto/get-user-tickets-query.dto';
import { TicketsService } from '../tickets.service';

@Resolver()
export class TicketsQueryResolver {

    constructor(
        private readonly ticketsService: TicketsService,
        private readonly graphqlFormetter: GraphQLPaginationFormatter
    ){}

    @Query("tickets")
    async getTickets(
        @Args("input") input: GetUserTicketsQueryDto,
        @ActiveUser() user: ActiveUserData,
    ): Promise<any> {
        const response = await this.ticketsService.getUserTickets(user.sub, input);
        return this.graphqlFormetter.format(response);
    }

    @Query("ticketById")
    async getTicketById(
        @Args("id", ParseIntPipe) id: number,
        @ActiveUser() user: ActiveUserData,
    ): Promise<any> {
        return this.ticketsService.getUserTicketById(id, user.sub, false);
    }
}
