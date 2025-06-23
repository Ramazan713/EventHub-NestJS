import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Auth } from '@/auth/decorators/auth.decorator';
import { AuthType } from '@/auth/enums/auth-type.enum';
import { PrismaService } from '@/prisma/prisma.service';
import { DraftEvent } from '@/graphql-types';
import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { EventDto } from '@/events/dto/event.dto';

@Auth(AuthType.None)
@Resolver("DraftEvent")
export class DraftEventResolver {

    constructor(
        private readonly prismaService: PrismaService
    ){}


    @ResolveField('event')
    async getEvent(
        @Parent() draftEvent: DraftEvent
    ) {
        const eventId = draftEvent.originalEventId
        if(!eventId) return null
        const event = await this.prismaService.event.findUnique({where: {id: eventId}});
        return mapToDto(EventDto, event)
    }
}
