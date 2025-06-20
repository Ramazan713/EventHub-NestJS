import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { DraftEventsService } from './draft-events.service';
import { CreateDraftEventDto } from './dto/create-draft-event.dto';
import { CurrentUser } from '@/auth/current-user.decorator';
import { TokenPayload } from '@/auth/token-payload.interface';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { Roles } from '@/auth/roles.decorator';
import { RolesGuard } from '@/auth/roles.guard';
import { Role } from '@prisma/client';
import { UpdateDraftEventDto } from './dto/update-draft-event.dto';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

@UseGuards(RolesGuard)
@UseGuards(JwtAuthGuard)
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
        @CurrentUser() tokenPayload: TokenPayload
    ) {
        return this.draftEventsService.createDraftEvent(tokenPayload, createDraftEventDto);
    }

    @Get()
    async getDrafts(
        @CurrentUser() tokenPayload: TokenPayload,
        @Query() paginationQueryDto: PaginationQueryDto
    ) {
        return this.draftEventsService.getDrafts(tokenPayload.sub, paginationQueryDto);
    }

    @HttpCode(200)
    @Patch(":id")
    async updateDraftEvent(
        @CurrentUser() tokenPayload: TokenPayload,
        @Param('id') id: number,
        @Body() updateDraftDto: UpdateDraftEventDto
    ) {
        return this.draftEventsService.updateDraft(id, tokenPayload, updateDraftDto)
    }
    

    @Get(":id")
    async getDraftById(
        @CurrentUser() tokenPayload: TokenPayload,
        @Param('id',ParseIntPipe) id: number
    ) {
        return this.draftEventsService.getDraftById(tokenPayload.sub, id);
    }

    @HttpCode(200)
    @Delete(":id")
    async deleteDraft(
        @CurrentUser() tokenPayload: TokenPayload,
        @Param('id') id: number
    ) {
        return this.draftEventsService.deleteDraft(id, tokenPayload.sub);
    }

    @HttpCode(200)
    @Post(":id/publish")
    async publishDraft(
        @CurrentUser() tokenPayload: TokenPayload,
        @Param('id') id: number
    ) {
        return this.draftEventsService.publishDraft(id, tokenPayload.sub);
    }

    @HttpCode(200)  
    @Post("from-event/:eventId")
    async createDraftFromEvent(
        @CurrentUser() tokenPayload: TokenPayload,
        @Param('eventId') eventId: number
    ) {
        return this.draftEventsService.createDraftFromEvent(tokenPayload, eventId);    
    }
    
}
