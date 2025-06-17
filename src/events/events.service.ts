import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { EventDto } from './dto/event.dto';
import { EventInfoDto } from '@/common/dto/event-info.dto';
import { mapToDto } from '@/common/mappers/map-to-dto.mapper';

@Injectable()
export class EventsService {

    constructor(private prisma: PrismaService){}

    async getEventsByOwner(organizerId: number): Promise<EventDto[]> {
        const events = await this.prisma.event.findMany({
            where: {
                organizerId,
                isCancelled: false
            },
            orderBy: {
                date: "asc"
            }
        });
        return events.map(event => mapToDto(EventDto, event));
    }


    async getUserEvents(userId: number): Promise<EventInfoDto[]> {
        const events = await this.prisma.event.findMany({
            where: {
                participants: {
                    some: {
                        userId
                    }
                },
                isCancelled: false
            },
            include: {
                organizer: true
            },
            orderBy: {
                date: "asc"
            }
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

}
