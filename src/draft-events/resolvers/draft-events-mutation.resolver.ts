import { Roles } from '@/auth/decorators/roles.decorator';
import { Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { DraftEventsService } from '../draft-events.service';

@Roles(Role.ORGANIZER, Role.ADMIN)
@Resolver()
export class DraftEventsMutationResolver {

    constructor(
        private draftEventsService: DraftEventsService
    ){}
}
