import { ParticipantStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional } from "class-validator";


export class GetEventParticipantQueryDto{
    @IsEnum(ParticipantStatus)
    @IsOptional()
    status?: ParticipantStatus

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    userId?: number

    @IsOptional()
    include?: "user"
}