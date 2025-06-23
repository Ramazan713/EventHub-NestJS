import { Query, Resolver } from '@nestjs/graphql';
import { EventsService } from '../events.service';
import { Auth } from '@/auth/decorators/auth.decorator';
import { AuthType } from '@/auth/enums/auth-type.enum';

@Auth(AuthType.None)
@Resolver()
export class EventsQueryResolver {

    constructor(
        private readonly eventsService: EventsService
    ) {}

    @Query("publicEvents")
    async getPublicEvents() {
        const results = await this.eventsService.getPublicEvents({});
        return results.data;
    }

}
