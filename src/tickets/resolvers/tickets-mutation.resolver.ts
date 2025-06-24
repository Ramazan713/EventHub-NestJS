import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { TicketsService } from '../tickets.service';
import { ActiveUser } from '@/auth/decorators/current-user.decorator';
import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';
import { ParseIntPipe } from '@nestjs/common';

@Resolver()
export class TicketsMutationResolver {

    constructor(
        private ticketsService: TicketsService
    ){}

    @Mutation("purchaseTicket")
    async purchaseTicket(
        @ActiveUser() user: ActiveUserData,
        @Args("eventId", ParseIntPipe) eventId: number
    ): Promise<any> {
        return this.ticketsService.createTicket(eventId, user.sub);
    }

    @Mutation("cancelTicket")
    async cancelTicket(
        @ActiveUser() user: ActiveUserData,
        @Args("id", ParseIntPipe) ticketId: number
    ): Promise<any> {
        await this.ticketsService.cancelTicket(ticketId, user.sub);
        return true
    }

}
