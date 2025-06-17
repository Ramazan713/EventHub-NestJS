import { ParticipantStatus } from "@prisma/client";
import { Expose } from "class-transformer";


export class EventParticipantDto {
    @Expose()
    id: number;

    @Expose()
    eventId: number;

    @Expose()
    userId: number;

    @Expose()
    status: ParticipantStatus;

    @Expose()
    registeredAt: Date;
}