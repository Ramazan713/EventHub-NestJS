import { Auth } from '@/auth/decorators/auth.decorator';
import { AuthType } from '@/auth/enums/auth-type.enum';
import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { EventsService } from '@/events/events.service';
import { PrismaService } from '@/prisma/prisma.service';
import { UserDto } from '@/users/dto/user.dto';
import { Query, Resolver } from '@nestjs/graphql';

@Auth(AuthType.None)
@Resolver()
export class OrganizersQueryResolver {


    constructor(
        private readonly eventsService: EventsService,
        private readonly prismaService: PrismaService
    ){}

    @Query("createdEvents")
    async createdEvents() {
        const items = await this.eventsService.getEventsByOwner(1,{});
        return items.data
    }

    @Query("organizer")
    async getOrganizer() {
        const user = await this.prismaService.user.findFirst({
            where: {
                id: 1
            }
        })
        return mapToDto(UserDto, user)
    }
}
