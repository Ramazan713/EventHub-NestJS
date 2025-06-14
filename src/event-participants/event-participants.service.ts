import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ParticipantStatus } from '@prisma/client';
import { EventParticipantDto } from './dto/event-participant.dto';

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
            await txn.eventParticipant.create({
                data: {
                    eventId: event.id,
                    userId,
                    status: ParticipantStatus.REGISTERED
                }
            })

            await txn.event.update({
                where: {
                    id: event.id
                },
                data: {
                    currentParticipants: { increment: 1 },
                    participants: { connect: { id: userId } }
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
            }
        });
        if (!event) {
            throw new BadRequestException("Event not found");
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

    async getParticipants(eventId: number, userId: number): Promise<EventParticipantDto[]> {
        const event = await this.prisma.event.findFirst({
            where: {
                id: eventId,
                isCancelled: false,
                organizerId: userId,
                price: 0,
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
            throw new BadRequestException("Event not found");
        }
        return event.participants.map(participant => EventParticipantDto.fromEventParticipant(participant));
    }

}
