import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { EventDto } from './dto/event.dto';
import { EventInfoDto } from '@/common/dto/event-info.dto';
import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { GetUserEventsQueryDto } from '@/users/dto/get-user-events-query.dto';
import { GetEventsQueryDto } from './dto/get-events-query.dto';
import { ParticipantStatus, Prisma } from '@prisma/client';

@Injectable()
export class EventsService {

    constructor(private prisma: PrismaService){}

    async getEventsByOwner(organizerId: number, query: GetEventsQueryDto): Promise<EventDto[]> {
        const {orderBy, where:whereQuery} = this.getEventsArgsFromParam(query); 
        const events = await this.prisma.event.findMany({
            where: {
                organizerId,
                ...whereQuery
            },
            orderBy: orderBy
        });
        return events.map(event => mapToDto(EventDto, event));
    }


    async getUserEvents(userId: number, query: GetUserEventsQueryDto): Promise<EventInfoDto[]> {
        const {orderBy, where:whereQuery} = this.getEventsArgsFromParam(query);
        
        const events = await this.prisma.event.findMany({
            where: {
                participants: {
                    some: {
                        userId,
                        status: query.status || ParticipantStatus.REGISTERED
                    }
                },
                ...whereQuery
            },
            include: query.include === "organizer" ? {
                organizer: true
            } : undefined,
            orderBy: orderBy
        });
        return events.map(event => mapToDto(EventInfoDto, event));
    }

    async cancelEvent(organizerId: number, eventId: number): Promise<EventDto> {
        const event = await this.prisma.$transaction(async (txn) => {
            const event = await txn.event.findFirst({
                where: {
                    id: eventId,
                    organizerId,
                    isCancelled: false
                }
            });
            if (!event) {
                throw new BadRequestException("Event not found");
            }
            await txn.event.update({
                where: {
                    id: event.id
                },
                data: {
                    isCancelled: true
                }
            })
            await txn.draftEvent.deleteMany({
                where: {
                    originalEventId: event.id
                }
            })
            return event
        })
        return mapToDto(EventDto, event);
    }

    private getEventsArgsFromParam(query: GetEventsQueryDto){
        const whereQuery: Prisma.EventWhereInput = {}
        const orderBy: Prisma.EventOrderByWithRelationInput = { }

        if(query.isCancelled !== undefined) whereQuery.isCancelled = query.isCancelled 
        else whereQuery.isCancelled = false
        if(query.isOnline !== undefined) whereQuery.isOnline  = query.isOnline 
       
        if(query.category) whereQuery.category = query.category

        if(query.q) whereQuery.OR = [{title: {contains: query.q ,mode: "insensitive"}}, {description: {contains: query.q, mode: "insensitive"}}]

        whereQuery.price = {};
        if (query.priceFrom) whereQuery.price.gte = query.priceFrom;
        if (query.priceTo)   whereQuery.price.lte = query.priceTo;

        whereQuery.date = {};
        if (query.dateFrom) whereQuery.date.gte = query.dateFrom;
        else whereQuery.date.gte = new Date();
        if (query.dateTo) whereQuery.date.lte = query.dateTo;

        if(query.location) whereQuery.location = {contains: query.location, mode: "insensitive"}


        if(query.sortBy){
            orderBy[query.sortBy] = query.sortOrder || "desc"
        }else{
            orderBy["date"] = query.sortOrder || 'desc'
        }
        return {
            where: whereQuery,
            orderBy: orderBy
        } 
    }

}
