import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { EventParticipantDto } from '@/event-participants/dto/event-participant.dto';
import { Event } from '@/graphql-types';
import { PrismaService } from '@/prisma/prisma.service';
import { UserDto } from '@/users/dto/user.dto';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { EventDto } from '../dto/event.dto';
import { DraftEventDto } from '@/draft-events/dto/draft-event.dto';
import { TicketDto } from '@/tickets/dto/ticket.dto';

@Resolver("Event")
export class EventResolver {

    constructor(
        private readonly prismaService: PrismaService
    ){}

    @ResolveField("participants")
    async participants(
        @Parent() event: Event
    ){
        const participants = await this.prismaService.eventParticipant.findMany({
            where: {
                eventId: event.id
            }
        });
        return participants.map(p => mapToDto(EventParticipantDto, p));
    }

    @ResolveField("organizer")
    async organizer(
        @Parent() event: Event
    ){
        const organizer = await this.prismaService.user.findUnique({
            where: {
                id: event.organizerId
            }
        });
        return mapToDto(UserDto, organizer);
    }

    @ResolveField("draft")
    async getDraft(
        @Parent() event: Event
    ){
        const draft = await this.prismaService.draftEvent.findUnique({
            where: {
                originalEventId: event.id
            }
        });
        return mapToDto(DraftEventDto, draft);
    }

    @ResolveField("tickets")
    async getTickets(
        @Parent() event: Event
    ){
        const tickets = await this.prismaService.ticket.findMany({
            where: {
                eventId: event.id
            }
        });
        return tickets.map(t => mapToDto(TicketDto, t));
    }
}
