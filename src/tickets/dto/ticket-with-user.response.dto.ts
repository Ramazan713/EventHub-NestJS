import { UserInfoDto } from "@/common/dto/user-info.dto";
import { Ticket, User } from "@prisma/client";
import { TicketDto } from "./ticket.dto";


export class TicketWithUserResponseDto extends TicketDto {
    user: UserInfoDto

    static from(ticket: Ticket, user: User): TicketWithUserResponseDto {
        const ticketDto = TicketDto.fromTicket(ticket)
        return {
            ...ticketDto,
            user: UserInfoDto.fromUser(user)
        }
    }
}