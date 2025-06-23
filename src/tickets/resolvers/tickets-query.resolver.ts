import { Auth } from '@/auth/decorators/auth.decorator';
import { AuthType } from '@/auth/enums/auth-type.enum';
import { Query, Resolver } from '@nestjs/graphql';
import { TicketsService } from '../tickets.service';

@Auth(AuthType.None)
@Resolver()
export class TicketsQueryResolver {

    constructor(
        private ticketsService: TicketsService
    ){}

    @Query("tickets")
    async getTickets(): Promise<any[]> {
        const items = await this.ticketsService.getUserTickets(1, {});
        return items.data
    }
}
