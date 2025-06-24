import { Auth } from '@/auth/decorators/auth.decorator';
import { AuthType } from '@/auth/enums/auth-type.enum';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { DraftEventsService } from '../draft-events.service';
import { ParseIntPipe } from '@nestjs/common';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

@Auth(AuthType.None)
@Resolver()
export class DraftEventsQueryResolver {

    constructor(
        private draftEventsService: DraftEventsService
    ){}


    @Query('draftEvents')
    async getDraftEvents(
        @Args("input") input: PaginationQueryDto
    ) {
        const items = await this.draftEventsService.getDrafts(1,input);
        return items.data
    }

    @Query("draftEventById")
    async getDraftEventById(@Args("id", ParseIntPipe) id: number) {
        return this.draftEventsService.getDraftById(1, id);
    }
}
