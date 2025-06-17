import { Event, EventParticipant, User } from "@prisma/client"
import { EventParticipantDto } from "./event-participant.dto"
import { Expose } from "class-transformer"
import { EventInfoDto } from "@/common/dto/event-info.dto"


@Expose()
export class ParticipantWithEventResponseDto extends EventParticipantDto {
    
    event: EventInfoDto

    static from(eventParticipant: EventParticipant, event: Event, organizer: User): ParticipantWithEventResponseDto {
        const eventParticipantDto = EventParticipantDto.fromEventParticipant(eventParticipant)
        return {
            ...eventParticipantDto,
            event: EventInfoDto.fromEvent(event, organizer)
        }
    }
}