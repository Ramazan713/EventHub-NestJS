import { PaymentsModule } from '@/payments/payments.module';
import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketsQueryResolver } from './resolvers/tickets-query.resolver';
import { TicketResolver } from './resolvers/ticket.resolver';
import { TicketsMutationResolver } from './resolvers/tickets-mutation.resolver';

@Module({
  providers: [TicketsService, TicketsQueryResolver, TicketResolver, TicketsMutationResolver],
  exports: [TicketsService],
  imports: [
    PaymentsModule,
  ],
  controllers: [TicketsController]
})
export class TicketsModule {}
