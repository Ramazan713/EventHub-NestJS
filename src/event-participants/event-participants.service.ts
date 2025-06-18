import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ParticipantStatus, Prisma } from '@prisma/client';
import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { EventParticipantDetailResponseDto } from './dto/event-participant-detail-response.dto';
import { GetEventParticipantQueryDto } from '@/events/dto/get-event-participant-query.dto';
import { GetUserParticipantQueryDto } from '@/users/dto/get-user-participant-query.dto';

@Injectable()
export class EventParticipantsService {

    constructor(
        private prisma: PrismaService
    ){}


    async register(eventId: number, userId: number): Promise<void> {
        const event = await this.prisma.event.findFirst({
            where: {
                id: eventId,
                isCancelled: false,
                price: 0
            },
            include: {
                participants: {
                    where: {
                        status: ParticipantStatus.REGISTERED
                    }
                }
            }
        });
        if (!event) {
            throw new NotFoundException("Event not found");
        }
        if(event.participants.map(participant => participant.userId).includes(userId)) {
            throw new BadRequestException("User is already registered");
        }
        

        if(event.capacity && event.capacity <= event.currentParticipants) {
            throw new BadRequestException("Event is full");
        }

        await this.prisma.$transaction(async (txn) => {
            await txn.eventParticipant.upsert({
                where: {
                    userId_eventId: {
                        eventId,
                        userId,
                    }
                },
                create: {
                    eventId: event.id,
                    userId,
                    status: ParticipantStatus.REGISTERED
                },
                update: {
                    status: ParticipantStatus.REGISTERED
                }
            })
            await txn.event.update({
                where: {
                    id: event.id
                },
                data: {
                    currentParticipants: { increment: 1 },
                    participants: { connect: { userId_eventId: { userId, eventId } } }
                }
            })
        })
    }

    async unregister(eventId: number, userId: number): Promise<void> {
        const event = await this.prisma.event.findFirst({
            where: {
                id: eventId,
                isCancelled: false,
                price: 0
            },
            include: {
                participants: {
                    where: {
                        status: ParticipantStatus.REGISTERED
                    }
                }
            }
        });
        if (!event) {
            throw new NotFoundException("Event not found");
        }
        if(!event.participants.map(participant => participant.userId).includes(userId)) {
            throw new BadRequestException("User is not registered");
        }

        await this.prisma.$transaction(async (txn) => {
            await txn.event.update({
                where: {
                    id: eventId
                },
                data: {
                    currentParticipants: { decrement: 1 },
                }
            })

            await txn.eventParticipant.update({
                where: {
                    userId_eventId: {
                        eventId,
                        userId,
                    }
                },
                data: {
                    status: ParticipantStatus.CANCELLED
                }
            })
        })
    }

    async getRegisteredParticipants(eventId: number, organizerId: number, query: GetEventParticipantQueryDto): Promise<EventParticipantDetailResponseDto[]> {
        const whereQuery: Prisma.EventParticipantWhereInput = {}
        if(query.status) whereQuery.status = query.status
        if(query.userId) whereQuery.userId = query.userId


        const event = await this.prisma.event.findFirst({
            where: {
                id: eventId,
                organizerId,
            },
            include: {
                participants: {
                    where: whereQuery,
                    include: query.include === "user" ? {
                        user: true
                    } : undefined
                },
            }
        });
        if (!event) {
            throw new NotFoundException("Event not found");
        }
        return event.participants.map(participant => mapToDto(EventParticipantDetailResponseDto, participant));
    }

    async getUserParticipants(userId: number, query: GetUserParticipantQueryDto): Promise<EventParticipantDetailResponseDto[]> {
        const whereQuery: Prisma.EventParticipantWhereInput = {}
        if(query.status) whereQuery.status = query.status
        if(query.eventId) whereQuery.eventId = query.eventId

        const eventParticipants = await this.prisma.eventParticipant.findMany({
            where: {
                userId,
                ...whereQuery,
            },
            include: {
                event: query.include === "event" ? {
                    include: {
                        organizer: true
                    }
                } : undefined
            }
        });
        return eventParticipants.map(participant => mapToDto(EventParticipantDetailResponseDto, participant));
    }

}
