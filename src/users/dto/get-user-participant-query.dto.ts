import { ParticipantStatus } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional } from "class-validator";


export class GetUserParticipantQueryDto{
    @IsEnum(ParticipantStatus)
    @IsOptional()
    status?: ParticipantStatus

    @IsNumber()
    @IsOptional()
    eventId?: number

    @IsOptional()
    include?: "event"
}