import { Auth } from '@/auth/decorators/auth.decorator';
import { AuthType } from '@/auth/enums/auth-type.enum';
import { EventInfoDto } from '@/common/dto/event-info.dto';
import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { Ticket } from '@/graphql-types';
import { PrismaService } from '@/prisma/prisma.service';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

@Auth(AuthType.None)
@Resolver("Ticket")
export class TicketResolver {

    constructor(
        private readonly prismaService: PrismaService,
    ){}

    @ResolveField("event")
    async event(@Parent() ticket: Ticket) {
        const event = await this.prismaService.event.findUnique({ where: { id: ticket.eventId } });
        return mapToDto(EventInfoDto, event);
    }
}
