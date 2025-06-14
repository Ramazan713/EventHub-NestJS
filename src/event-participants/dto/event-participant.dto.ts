import { Expose, plainToClass } from "class-transformer";
import { EventParticipant, ParticipantStatus } from "@prisma/client";

@Expose()
export class EventParticipantDto {
    id: number;
    eventId: number;
    userId: number;
    status: ParticipantStatus;
    registeredAt: Date;

    static fromEventParticipant(eventParticipant: EventParticipant): EventParticipantDto {
        return plainToClass(EventParticipantDto, eventParticipant)
    }
}