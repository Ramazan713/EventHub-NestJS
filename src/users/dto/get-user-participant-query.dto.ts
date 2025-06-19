import { ParticipantStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional } from "class-validator";


export class GetUserParticipantQueryDto{
    @IsEnum(ParticipantStatus)
    @IsOptional()
    status?: ParticipantStatus

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    eventId?: number

    @IsOptional()
    include?: "event"
}