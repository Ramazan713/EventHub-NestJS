import { Roles } from '@/auth/decorators/roles.decorator';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { ParseIntPipe } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { DraftEventsService } from '../draft-events.service';
import { ActiveUser } from '@/auth/decorators/current-user.decorator';
import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';

@Roles(Role.ORGANIZER, Role.ADMIN)
@Resolver()
export class DraftEventsQueryResolver {

    constructor(
        private draftEventsService: DraftEventsService
    ){}


    @Query('draftEvents')
    async getDraftEvents(
        @Args("input") input: PaginationQueryDto,
        @ActiveUser() user: ActiveUserData
    ) {
        const items = await this.draftEventsService.getDrafts(user.sub,input);
        return items.data
    }

    @Query("draftEventById")
    async getDraftEventById(
        @Args("id", ParseIntPipe) id: number,
        @ActiveUser() user: ActiveUserData
    ) {
        return this.draftEventsService.getDraftById(user.sub, id);
    }
}
