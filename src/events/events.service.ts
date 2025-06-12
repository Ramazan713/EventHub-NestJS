import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventDto } from './dto/event.dto';
import * as moment from 'moment';

@Injectable()
export class EventsService {

    constructor(private prisma: PrismaService){}

    async getEvents(organizerId: number): Promise<EventDto[]> {
        const events = await this.prisma.event.findMany({
            where: {
                organizerId,
                isCancelled: false
            },
            orderBy: {
                date: "asc"
            }
        });
        return events.map(event => EventDto.fromEvent(event));
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
        return EventDto.fromEvent(event)
    }

}
