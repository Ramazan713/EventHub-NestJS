import { ActiveUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { DraftEventsService } from './draft-events.service';
import { CreateDraftEventDto } from './dto/create-draft-event.dto';
import { UpdateDraftEventDto } from './dto/update-draft-event.dto';


@Roles(Role.ORGANIZER, Role.ADMIN)
@Controller('draft-events')
export class DraftEventsController {

    constructor(
        private draftEventsService: DraftEventsService
    ){}

    @HttpCode(201)
    @Post()
    async createDraftEvent(
        @Body() createDraftEventDto: CreateDraftEventDto,
        @ActiveUser() activeUser: ActiveUserData
    ) {
        return this.draftEventsService.createDraftEvent(activeUser, createDraftEventDto);
    }

    @Get()
    async getDrafts(
        @ActiveUser() activeUser: ActiveUserData,
        @Query() paginationQueryDto: PaginationQueryDto
    ) {
        return this.draftEventsService.getDrafts(activeUser.sub, paginationQueryDto);
    }

    @HttpCode(200)
    @Patch(":id")
    async updateDraftEvent(
        @ActiveUser() activeUser: ActiveUserData,
        @Param('id') id: number,
        @Body() updateDraftDto: UpdateDraftEventDto
    ) {
        return this.draftEventsService.updateDraft(id, activeUser, updateDraftDto)
    }
    

    @Get(":id")
    async getDraftById(
        @ActiveUser() activeUser: ActiveUserData,
        @Param('id',ParseIntPipe) id: number
    ) {
        return this.draftEventsService.getDraftById(activeUser.sub, id);
    }

    @HttpCode(200)
    @Delete(":id")
    async deleteDraft(
        @ActiveUser() activeUser: ActiveUserData,
        @Param('id') id: number
    ) {
        return this.draftEventsService.deleteDraft(id, activeUser.sub);
    }

    @HttpCode(200)
    @Post(":id/publish")
    async publishDraft(
        @ActiveUser() activeUser: ActiveUserData,
        @Param('id') id: number
    ) {
        return this.draftEventsService.publishDraft(id, activeUser.sub);
    }

    @HttpCode(200)  
    @Post("from-event/:eventId")
    async createDraftFromEvent(
        @ActiveUser() activeUser: ActiveUserData,
        @Param('eventId') eventId: number
    ) {
        return this.draftEventsService.createDraftFromEvent(activeUser, eventId);    
    }
    
}
