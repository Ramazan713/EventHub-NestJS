import { UserInfoDto } from '@/common/dto/user-info.dto';
import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { EventInfo } from '@/graphql-types';
import { PrismaService } from '@/prisma/prisma.service';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

@Resolver("EventInfo")
export class EventInfoResolver {

    constructor(
        private readonly prismaService: PrismaService
    ) {}

    @ResolveField("organizer")
    async getOrganizer(
        @Parent() eventInfo: EventInfo
    ) {
        const organizer = await this.prismaService.user.findUnique({
            where: {
                id: eventInfo.organizerId
            }
        })
        return mapToDto(UserInfoDto, organizer);
    }
}
