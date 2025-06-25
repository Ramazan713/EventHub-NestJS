import { Roles } from '@/auth/decorators/roles.decorator';
import { PubSubService } from '@/pub-sub/pub-sub.service';
import { Resolver, Subscription } from '@nestjs/graphql';
import { Role } from '@prisma/client';


@Roles(Role.ORGANIZER, Role.ADMIN)
@Resolver()
export class DraftEventsSubscriptionResolver {

    constructor(
        private readonly pubsubService: PubSubService
    ) {}


    @Subscription('draftEventCreated', {
        filter(this: DraftEventsSubscriptionResolver, payload, variables, context) {
            return payload.draftEventCreated.organizerId === context.req.user.sub;
        }
     })
    draftEventCreated() {
        return this.pubsubService.asyncIterableIterator('draftEventCreated')
    }

    @Subscription('draftEventUpdated', {
        filter(this: DraftEventsSubscriptionResolver, payload, variables, context) {
            return payload.draftEventUpdated.organizerId === context.req.user.sub;
        }
     })
    draftEventUpdated() {
        return this.pubsubService.asyncIterableIterator('draftEventUpdated')
    }

    @Subscription('draftEventDeleted', {
        filter(this: DraftEventsSubscriptionResolver, payload, variables, context) {
            return payload.draftEventDeleted.organizerId === context.req.user.sub;
        }
     })
    draftEventDeleted() {
        return this.pubsubService.asyncIterableIterator('draftEventDeleted')
    }

}
