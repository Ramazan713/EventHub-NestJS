import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { EventDto } from './dto/event.dto';
import * as moment from 'moment';

@Injectable()
export class EventsService {

    constructor(private prisma: PrismaService){}

    async createEvent(userId: number, createEventDto: CreateEventDto): Promise<EventDto>{
        const minFutureDate = moment(new Date()).add(1,"h").toDate()        
        if(createEventDto.date < minFutureDate){
            throw new BadRequestException("Date must be at least 1 hour in advance")
        }

        const event = await this.prisma.event.create({
            data: {
                ...createEventDto,
                organizerId: userId
            }
        })
        return EventDto.fromEvent(event)
    }

}
