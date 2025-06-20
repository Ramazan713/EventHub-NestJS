import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { EventDto } from './dto/event.dto';
import { EventInfoDto } from '@/common/dto/event-info.dto';
import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { GetUserEventsQueryDto } from '@/users/dto/get-user-events-query.dto';
import { GetEventsQueryDto } from './dto/get-events-query.dto';
import { ParticipantStatus, Prisma, TicketStatus } from '@prisma/client';
import { PaymentsService } from '@/payments/payments.service';
import { DateUtils } from '@/common/date.utils';
import { PaginationService } from '@/common/services/pagination.service';
import { PaginationResult } from '@/common/interfaces/pagination-result.interface';
import { SortOrder } from '@/common/enums/sort-order.enum';

@Injectable()
export class EventsService {

    constructor(
        private prisma: PrismaService,
        private paymentsService: PaymentsService,
        private paginationService: PaginationService
    ){}

    async getEventsByOwner(organizerId: number, query: GetEventsQueryDto): Promise<PaginationResult<EventDto>> {
        const {where:whereQuery, orderBy} = this.getEventsArgsFromParam(query); 
        const response = await this.paginationService.paginate(
            this.prisma.event,
            {
                pagination: query,
                where: {
                    organizerId,
                    ...whereQuery
                },
                
                orderBy: orderBy,
                mapItems(event) {
                    return mapToDto(EventDto, event)
                },
            }
        )
        return response
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
