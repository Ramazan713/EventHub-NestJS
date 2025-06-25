import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateDraftEventDto } from './dto/create-draft-event.dto';
import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';
import { DraftEventDto } from './dto/draft-event.dto';
import { UpdateDraftEventDto } from './dto/update-draft-event.dto';
import { EventDto } from '@/events/dto/event.dto';
import { pick } from 'lodash';
import { DateUtils } from '@/common/date.utils';
import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { PaginationQueryDto } from '@/pagination/dto/pagination-query.dto';
import { DraftEvent } from '@prisma/client';
import { PaginationService } from '@/pagination/services/pagination.service';
import { PaginationResult } from '@/pagination/interfaces/pagination-result.interface';
import { DraftEvents } from './enums/draft-events.enum';
import { PubSubService } from '@/pub-sub/pub-sub.service';

@Injectable()
export class DraftEventsService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: PaginationService,
        private readonly pubsubService: PubSubService
    ){}

    async createDraftEvent(tokenPayload: ActiveUserData,createDraftEventDto: CreateDraftEventDto) {
        const minFutureDate = DateUtils.addHours();
        if(createDraftEventDto.date < minFutureDate){
            throw new BadRequestException("Date must be at least 1 hour in advance");
        }
        const createdDraft = await this.prisma.draftEvent.create({
            data: {
                ...createDraftEventDto,
                organizerId: tokenPayload.sub,
            }
        });
        const createdDraftDto = mapToDto(DraftEventDto, createdDraft);
        this.pubsubService.publish(DraftEvents.CREATED, createdDraftDto)
        return createdDraftDto
    }

    async getDrafts(organizerId: number, paginationQueryDto: PaginationQueryDto): Promise<PaginationResult<DraftEventDto>> {
        const draftsPagination = await this.paginationService.paginate(
            this.prisma.draftEvent,
            {
                pagination: paginationQueryDto,
                where: {
                    organizerId
                },
                orderBy: {
                    date: "asc"
                },
                mapItems(draft: DraftEvent) {
                    return DraftEventDto.fromDraftEvent(draft)
                },
            }
        )
        return draftsPagination
    }

    async getDraftById(organizerId: number, id: number): Promise<DraftEventDto> {
        const draft = await this.prisma.draftEvent.findFirst({
            where: {
                id,
                organizerId
            }
        });
        if (!draft) {
            throw new NotFoundException("Draft not found");
        }
        return DraftEventDto.fromDraftEvent(draft);
    }

    async updateDraft(id: number, tokenPayload: ActiveUserData, updateDraftDto: UpdateDraftEventDto): Promise<DraftEventDto> {
        const draft = await this.prisma.draftEvent.findFirst({
            where: {
                id,
                organizerId: tokenPayload.sub
            }
        });
        if (!draft) {
            throw new NotFoundException("Draft not found");
        }

        const minFutureDate = DateUtils.addHours();
        updateDraftDto
        if(updateDraftDto.date && updateDraftDto.date < minFutureDate){
            throw new BadRequestException("Date must be at least 1 hour in advance");
        }

        const updatedDraft = await this.prisma.draftEvent.update({
            where: { id, organizerId: tokenPayload.sub },
            data: updateDraftDto
        });
        const updatedDraftDto = mapToDto(DraftEventDto, updatedDraft);

        this.pubsubService.publish(DraftEvents.UPDATED, updatedDraftDto)

        return updatedDraftDto
    }

    async deleteDraft(id: number, organizerId: number): Promise<void> {
        const draft = await this.prisma.draftEvent.findFirst({
            where: {
                id,
                organizerId
            }
        });
        if (!draft) {
            throw new NotFoundException("Draft not found");
        }

        const deletedDraft = await this.prisma.draftEvent.delete({
            where: { id, organizerId }
        });
        const deletedDraftDto = mapToDto(DraftEventDto, deletedDraft);
        this.pubsubService.publish(DraftEvents.DELETED, deletedDraftDto)
    }

    async publishDraft(id: number, organizerId: number): Promise<EventDto> {
        const draft = await this.prisma.draftEvent.findFirst({
            where: {
                id,
                organizerId
            }
        });
        if (!draft) {
            throw new NotFoundException("Draft not found");
        }

        const minFutureDate = DateUtils.addHours();
        if(draft.date < minFutureDate){
            throw new BadRequestException("Date must be at least 1 hour in advance");
        }

        const result = await this.prisma.$transaction(async(txn) => {
            const draftData = pick(draft, ["title", "description", "category", "date", "price","capacity", "isOnline", "location","organizerId"])
            const event = await txn.event.upsert({
                where: { id: draft.originalEventId ?? -1 },
                update: draftData,
                create: draftData
            })

            const draftEventDeleted = await txn.draftEvent.delete({
                where: {id: draft.id}
            })
            const draftEventDeletedDto = mapToDto(DraftEventDto, draftEventDeleted);
            this.pubsubService.publish(DraftEvents.DELETED, draftEventDeletedDto)
            return event
        })

        return mapToDto(EventDto, result)
    }

    async createDraftFromEvent(tokenPayload: ActiveUserData, eventId: number): Promise<DraftEventDto> {
        const event = await this.prisma.event.findFirst({
            where: {
                id: eventId,
                organizerId: tokenPayload.sub,
                isCancelled: false
            }
        });
        if (!event) {
            throw new NotFoundException("Event not found");
        }
        const draft = await this.prisma.draftEvent.findFirst({
            where: {
                originalEventId: eventId,
                organizerId: tokenPayload.sub
            }
        })
        if(draft){
            return DraftEventDto.fromDraftEvent(draft);
        }
        const draftData = pick(event, ["title", "description", "category", "date", "price","capacity", "isOnline", "location","organizerId"])
        const newDraft = await this.prisma.draftEvent.create({
            data: {
                ...draftData,
                originalEventId: event.id
            }
        })
        const newDraftDto = mapToDto(DraftEventDto, newDraft);
        this.pubsubService.publish(DraftEvents.CREATED, newDraftDto)

        return newDraftDto
    }

}
