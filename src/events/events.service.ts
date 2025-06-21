import { DateUtils } from '@/common/date.utils';
import { BaseEventsQueryDto } from '@/common/dto/base-events-query.dto';
import { EventInfoDto } from '@/common/dto/event-info.dto';
import { SortOrder } from '@/common/enums/sort-order.enum';
import { PaginationResult } from '@/common/interfaces/pagination-result.interface';
import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { PaginationService } from '@/common/services/pagination.service';
import { OrganizerEventsQueryDto } from '@/organizers/dto/organizer-events-query.dto';
import { PaymentsService } from '@/payments/payments.service';
import { PrismaService } from '@/prisma/prisma.service';
import { UserEventsQueryDto } from '@/users/dto/user-events-query.dto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ParticipantStatus, Prisma, TicketStatus, User } from '@prisma/client';
import { EventDto } from './dto/event.dto';
import { PublicEventsQueryDto } from './dto/public-events-query.dto';
import { PublicEventQueryDto } from './dto/public-event-query.dto';

@Injectable()
export class EventsService {

    constructor(
        private prisma: PrismaService,
        private paymentsService: PaymentsService,
        private paginationService: PaginationService
    ){}


    async getEventByOwnerId(organizerId: number, eventId: number): Promise<EventDto> {
        const event = await this.prisma.event.findUnique({
            where: {
                id: eventId,
                organizerId: organizerId
            }
        })
        if(!event) throw new NotFoundException('Event not found')
        return mapToDto(EventDto, event)
    }

    async getPublicEventById(eventId: number, query: PublicEventQueryDto): Promise<EventInfoDto> {
        const event = await this.prisma.event.findUnique({
            where: {
                id: eventId,
                isCancelled: false
            },
            include: query.include === "organizer" ? {
                organizer: true
            } : undefined
        })
        if(!event) throw new NotFoundException('Event not found')
        return mapToDto(EventInfoDto, event)
    }

    async getUserEventById(userId: number, eventId: number, query: UserEventsQueryDto): Promise<EventInfoDto> {
        const event = await this.prisma.event.findFirst({
            where: {
                id: eventId,
                participants: {
                    some: {
                        userId
                    }
                }
            },
            include: query.include === "organizer" ? {
                organizer: true
            } : undefined
        })
        if(!event) throw new NotFoundException('Event not found')
        return mapToDto(EventInfoDto, event)
    }

    async getEventsByOwner(organizerId: number, query: OrganizerEventsQueryDto): Promise<PaginationResult<EventDto>> {
        const {where:whereQuery, orderBy} = this.getEventsArgsFromParam(query); 
        
        if(query.isCancelled !== undefined) whereQuery.isCancelled = query.isCancelled 
        else whereQuery.isCancelled = false

        const response = await this.paginationService.paginate(
            this.prisma.event,
            {
                pagination: query,
                where: {
                    organizerId,
                    ...whereQuery,
                } as Prisma.EventWhereInput,
                orderBy: orderBy,
                mapItems(event) {
                    return mapToDto(EventDto, event)
                },
            }
        )
        return response
    }

     async getPublicEvents(query: PublicEventsQueryDto): Promise<PaginationResult<EventInfoDto>> {
        const {orderBy, where:whereQuery} = this.getEventsArgsFromParam(query);

        if(query.organizerId !== undefined) whereQuery.organizerId = query.organizerId
        whereQuery.isCancelled = false

        const eventsPagination = await this.paginationService.paginate(
            this.prisma.event,
            {
                pagination: query,
                where: whereQuery,
                include: query.include === "organizer" ? {
                    organizer: true
                } : undefined,
                orderBy: orderBy,
                mapItems(event) {
                    return mapToDto(EventInfoDto, event)
                },
            }
        )
        return eventsPagination
    }

    async getUserEvents(userId: number, query: UserEventsQueryDto): Promise<PaginationResult<EventInfoDto>> {
        const {orderBy, where:whereQuery} = this.getEventsArgsFromParam(query);
        
        if(query.isCancelled !== undefined) whereQuery.isCancelled = query.isCancelled 
        else whereQuery.isCancelled = false

        if(query.organizerId !== undefined) whereQuery.organizerId = query.organizerId

        const eventsPagination = await this.paginationService.paginate(
            this.prisma.event,
            {
                pagination: query,
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
                orderBy: orderBy,
                mapItems(event) {
                    return mapToDto(EventInfoDto, event)
                },
            }
        )

        return eventsPagination
    }

    async cancelEvent(organizerId: number, eventId: number): Promise<EventDto> {
        const event = await this.prisma.$transaction(async (txn) => {
            const event = await txn.event.findFirst({
                where: {
                    id: eventId,
                    organizerId,
                    isCancelled: false
                },
                include: {
                    tickets: {
                        where: {
                            status: TicketStatus.BOOKED
                        }
                    }
                }
            });
            if (!event) {
                throw new NotFoundException("Event not found");
            }
            if(event.date < DateUtils.addMinutes({minutes: 10})){
                throw new BadRequestException("Event date is too soon to cancel")
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

            await Promise.all(
                event.tickets.map(async (ticket) => {
                    const paymentIntentId = ticket.paymentIntentId
                    if(paymentIntentId){
                        await this.paymentsService.refundPayment(paymentIntentId)
                    }
                })
            )
            await Promise.all(
                event.tickets.map(async (ticket) => {
                   await txn.ticket.update({
                       where: {
                           id: ticket.id
                       },
                       data: {
                           status: TicketStatus.REFUND_REQUESTED
                       }
                   })
                })
            )
            return event
        })
        return mapToDto(EventDto, event);
    }

    private getEventsArgsFromParam(query: BaseEventsQueryDto){
        const whereQuery: Prisma.EventWhereInput = {}
        const orderBy: Prisma.EventOrderByWithRelationInput = { }

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

        let sortBy: string =  query.sortBy || "date"
        let sortOrder: SortOrder = query.sortOrder || "desc"
        orderBy[sortBy] = sortOrder
        return {
            where: whereQuery,
            orderBy: orderBy,
            sortBy,
            sortOrder
        } 
    }

}
