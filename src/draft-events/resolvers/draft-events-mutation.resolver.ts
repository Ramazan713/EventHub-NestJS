import { Auth } from '@/auth/decorators/auth.decorator';
import { AuthType } from '@/auth/enums/auth-type.enum';
import { Resolver } from '@nestjs/graphql';
import { DraftEventsService } from '../draft-events.service';

@Auth(AuthType.None)
@Resolver()
export class DraftEventsMutationResolver {

    constructor(
        private draftEventsService: DraftEventsService
    ){}
}
