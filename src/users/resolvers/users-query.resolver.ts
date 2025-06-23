import { Query, Resolver } from '@nestjs/graphql';
import { Auth } from '@/auth/decorators/auth.decorator';
import { AuthType } from '@/auth/enums/auth-type.enum';
import { EventsService } from '@/events/events.service';
import { UsersService } from '../users.service';
import { PrismaService } from '@/prisma/prisma.service';
import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { UserDto } from '../dto/user.dto';

@Auth(AuthType.None)
@Resolver()
export class UsersQueryResolver {

    constructor(
        private readonly eventsService: EventsService,
        private readonly usersService: UsersService,
        private readonly prismaService: PrismaService
    ){}


    @Query("registeredEvents")
    async registeredEvents() {
        const items = await this.eventsService.getEventsByOwner(1,{}); 
        return items.data
    }

    @Query("user")
    async user() {
        const user = await this.prismaService.user.findFirst({
            where: {
                id: 1
            }
        })
        return mapToDto(UserDto, user)
    }
}
