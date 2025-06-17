import { EventInfoDto } from "@/common/dto/event-info.dto";
import { UserInfoDto } from "@/common/dto/user-info.dto";
import { Expose, Type } from "class-transformer";
import { TicketDto } from "./ticket.dto";


export class TicketWithDetailResponseDto extends TicketDto {

    @Type(() => EventInfoDto)
    @Expose()
    event?: EventInfoDto

    @Type(() => UserInfoDto)
    @Expose()
    user?: UserInfoDto
}