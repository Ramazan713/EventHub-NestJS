import { Roles } from '@/auth/decorators/roles.decorator';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { DraftEventsService } from '../draft-events.service';
import { CreateDraftEventDto } from '../dto/create-draft-event.dto';
import { ActiveUser } from '@/auth/decorators/current-user.decorator';
import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';
import { UpdateDraftEventDto } from '../dto/update-draft-event.dto';
import { ParseIntPipe } from '@nestjs/common';

@Roles(Role.ORGANIZER, Role.ADMIN)
@Resolver()
export class DraftEventsMutationResolver {

    constructor(
        private draftEventsService: DraftEventsService
    ){}

    @Mutation("createDraft")
    async createDraftEvent(
        @Args("input") input: CreateDraftEventDto,
        @ActiveUser() user: ActiveUserData
    ): Promise<any> {
        return this.draftEventsService.createDraftEvent(user, input);
    }

    @Mutation("updateDraft")
    async updateDraftEvent(
        @Args("input") input: UpdateDraftEventDto,
        @Args("id", ParseIntPipe) id: number,
        @ActiveUser() user: ActiveUserData
    ): Promise<any> {
        return this.draftEventsService.updateDraft(id, user, input);
    }

    @Mutation("deleteDraft")
    async deleteDraftEvent(
        @Args("id", ParseIntPipe) id: number,
        @ActiveUser() user: ActiveUserData
    ): Promise<any> {
        return this.draftEventsService.deleteDraft(id, user.sub);
    }

    @Mutation("publishDraft")
    async publishDraftEvent(
        @Args("id", ParseIntPipe) id: number,
        @ActiveUser() user: ActiveUserData
    ): Promise<any> {
        return this.draftEventsService.publishDraft(id, user.sub);
    }

    @Mutation("createDraftFromEvent")
    async createDraftFromEvent(
        @Args("eventId", ParseIntPipe) eventId: number,
        @ActiveUser() user: ActiveUserData
    ): Promise<any> {
        return this.draftEventsService.createDraftFromEvent(user, eventId);
    }
}
