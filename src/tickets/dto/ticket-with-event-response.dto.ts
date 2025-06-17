import { EventInfoDto } from "@/common/dto/event-info.dto";
import { TicketDto } from "./ticket.dto";
import { Event, Ticket, User } from "@prisma/client";


export class TicketWithEventResponseDto extends TicketDto {
    event: EventInfoDto

    static from(ticket: Ticket, event: Event, organizer?: User): TicketWithEventResponseDto {
        const ticketDto = TicketDto.fromTicket(ticket)
        return {
            ...ticketDto,
            event: EventInfoDto.fromEvent(event, organizer)
        }
    }
}