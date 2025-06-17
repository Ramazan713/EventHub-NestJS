import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ParticipantStatus } from '@prisma/client';
import { EventParticipantDto } from './dto/event-participant.dto';
import { ParticipantWithUserResponseDto } from './dto/participant-with-user-response.dto';
import { ParticipantWithEventResponseDto } from './dto/participant-with-event-response.dto';

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

    async getRegisteredParticipants(eventId: number, organizerId: number): Promise<ParticipantWithUserResponseDto[]> {
        const event = await this.prisma.event.findFirst({
            where: {
                id: eventId,
                organizerId,
                isCancelled: false,
            },
            include: {
                participants: {
                    where: {
                        status: ParticipantStatus.REGISTERED
                    },
                    include: {
                        user: true
                    }
                },
            }
        });
        if (!event) {
            throw new NotFoundException("Event not found");
        }
        return event.participants.map(participant => ParticipantWithUserResponseDto.from(participant, participant.user));
    }

    async getUserParticipants(userId: number): Promise<ParticipantWithEventResponseDto[]> {
        const eventParticipants = await this.prisma.eventParticipant.findMany({
            where: {
                userId,
                status: ParticipantStatus.REGISTERED
            },
            include: {
                event: {
                    include: {
                        organizer: true
                    }
                }
            }
        });
        return eventParticipants.map(participant => ParticipantWithEventResponseDto.from(participant, participant.event, participant.event.organizer));
    }

}
