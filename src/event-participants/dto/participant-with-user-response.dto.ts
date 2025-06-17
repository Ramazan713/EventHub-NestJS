import { EventParticipant, User } from "@prisma/client";
import { Expose } from "class-transformer";
import { EventParticipantDto } from "./event-participant.dto";
import { UserInfoDto } from "@/common/dto/user-info.dto";


@Expose()
export class ParticipantWithUserResponseDto extends EventParticipantDto {
    
    user: UserInfoDto

    static from(eventParticipant: EventParticipant, user: User): ParticipantWithUserResponseDto {
        const eventParticipantDto = EventParticipantDto.fromEventParticipant(eventParticipant)
        return {
            ...eventParticipantDto,
            user: UserInfoDto.fromUser(user)
        }
    }
}