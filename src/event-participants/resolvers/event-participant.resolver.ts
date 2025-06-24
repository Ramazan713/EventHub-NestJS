import { EventInfoDto } from '@/common/dto/event-info.dto';
import { UserInfoDto } from '@/common/dto/user-info.dto';
import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { EventParticipant } from '@/graphql-types';
import { PrismaService } from '@/prisma/prisma.service';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';


@Resolver("EventParticipant")
export class EventParticipantResolver {

    constructor(
        private readonly prismaService: PrismaService
    ){}

    @ResolveField("event")
    async getEvent(
        @Parent() participant: EventParticipant
    ) {
        const event = await this.prismaService.event.findFirst({
            where: {
                id: participant.eventId
            }
        });
        return mapToDto(EventInfoDto, event)
    }

    @ResolveField("user")
    async getUser(
        @Parent() participant: EventParticipant
    ) {
        const user = await this.prismaService.user.findFirst({
            where: {
                id: participant.userId
            }
        });
        return mapToDto(UserInfoDto, user)
    }

}
