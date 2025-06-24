import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { EventDto } from '@/events/dto/event.dto';
import { DraftEvent } from '@/graphql-types';
import { PrismaService } from '@/prisma/prisma.service';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';


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
