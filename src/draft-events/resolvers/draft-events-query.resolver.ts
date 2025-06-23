import { Auth } from '@/auth/decorators/auth.decorator';
import { AuthType } from '@/auth/enums/auth-type.enum';
import { Query, Resolver } from '@nestjs/graphql';
import { DraftEventsService } from '../draft-events.service';

@Auth(AuthType.None)
@Resolver()
export class DraftEventsQueryResolver {

    constructor(
        private draftEventsService: DraftEventsService
    ){}


    @Query('draftEvents')
    async getDraftEvents() {
        const items = await this.draftEventsService.getDrafts(1,{});
        return items.data
    }
}
