import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDraftEventDto } from './dto/create-draft-event.dto';
import { TokenPayload } from '../auth/token-payload.interface';
import * as moment from 'moment';
import { DraftEventDto } from './dto/draft-event.dto';
import { UpdateDraftEventDto } from './dto/update-draft-event.dto';
import { EventDto } from '../events/dto/event.dto';
import { pick } from 'lodash';

@Injectable()
export class DraftEventsService {

    constructor(
        private prisma: PrismaService
    ){}

    async createDraftEvent(tokenPayload: TokenPayload,createDraftEventDto: CreateDraftEventDto) {
        const minFutureDate = moment(new Date()).add(1,"h").toDate()        
        if(createDraftEventDto.date < minFutureDate){
            throw new BadRequestException("Date must be at least 1 hour in advance")
        }
        return this.prisma.draftEvent.create({
            data: {
                ...createDraftEventDto,
                organizerId: tokenPayload.sub,
            }
        });
    }

    async getDrafts(organizerId: number): Promise<DraftEventDto[]> {
        const drafts = await this.prisma.draftEvent.findMany({
            where: {
                organizerId
            },
            orderBy: {
                date: "asc"
            }
        });
        return drafts.map(draft => DraftEventDto.fromDraftEvent(draft));
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

    async updateDraft(id: number, tokenPayload: TokenPayload, updateDraftDto: UpdateDraftEventDto): Promise<DraftEventDto> {
        const draft = await this.prisma.draftEvent.findFirst({
            where: {
                id,
                organizerId: tokenPayload.sub
            }
        });
        if (!draft) {
            throw new NotFoundException("Draft not found");
        }

        const minFutureDate = moment(new Date()).add(1,"h").toDate();
        if(updateDraftDto.date && updateDraftDto.date < minFutureDate){
            throw new BadRequestException("Date must be at least 1 hour in advance");
        }

        const updatedDraft = await this.prisma.draftEvent.update({
            where: { id, organizerId: tokenPayload.sub },
            data: updateDraftDto
        });

        return DraftEventDto.fromDraftEvent(updatedDraft);
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

        await this.prisma.draftEvent.delete({
            where: { id, organizerId }
        });
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

        const minFutureDate = moment(new Date()).add(1,"h").toDate();
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

            await txn.draftEvent.delete({
                where: {id: draft.id}
            })
            return event
        })

        return EventDto.fromEvent(result);
    }

    async createDraftFromEvent(tokenPayload: TokenPayload, eventId: number): Promise<DraftEventDto> {
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

        return DraftEventDto.fromDraftEvent(newDraft);
    }

}
