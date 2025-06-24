import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { DraftEventDto } from '@/draft-events/dto/draft-event.dto';
import { EventParticipantsService } from '@/event-participants/event-participants.service';
import { Event, PaginationInput } from '@/graphql-types';
import { PaginationQueryDto } from '@/pagination/dto/pagination-query.dto';
import { GraphQLPaginationFormatter } from '@/pagination/formetters/graphql-pagination.formatter';
import { PrismaService } from '@/prisma/prisma.service';
import { TicketsService } from '@/tickets/tickets.service';
import { UserDto } from '@/users/dto/user.dto';
import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { GetEventParticipantQueryDto } from '../dto/get-event-participant-query.dto';

@Resolver("Event")
export class EventResolver {

    constructor(
        private readonly prismaService: PrismaService,
        private readonly eventParticipantsService: EventParticipantsService,
        private readonly graphqlFormetter: GraphQLPaginationFormatter,
        private readonly ticketsService: TicketsService
    ){}

    @ResolveField("participants")
    async participants(
        @Parent() event: Event,
        @Args("input") input: PaginationInput
    ){
        const response = await this.eventParticipantsService.getRegisteredParticipants(event.id, event.organizerId, {...input} as GetEventParticipantQueryDto);
        return this.graphqlFormetter.format(response);
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
        @Parent() event: Event,
        @Args("input") input: PaginationQueryDto
    ){
        const response = await this.ticketsService.getEventTickets(event.id, event.organizerId, input);
        return this.graphqlFormetter.format(response);
    }
}
