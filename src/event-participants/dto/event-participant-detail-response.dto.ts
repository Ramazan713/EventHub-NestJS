import { EventInfoDto } from "@/common/dto/event-info.dto";
import { EventParticipantDto } from "./event-participant.dto";
import { Expose, Type } from "class-transformer";
import { UserInfoDto } from "@/common/dto/user-info.dto";


export class EventParticipantDetailResponseDto extends EventParticipantDto{

    @Type(() => EventInfoDto)
    @Expose()
    event?: EventInfoDto

    @Type(() => UserInfoDto)
    @Expose()
    user?: UserInfoDto
}