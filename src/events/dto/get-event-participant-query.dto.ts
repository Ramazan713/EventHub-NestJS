import { ParticipantStatus } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional } from "class-validator";


export class GetEventParticipantQueryDto{
    @IsEnum(ParticipantStatus)
    @IsOptional()
    status?: ParticipantStatus

    @IsNumber()
    @IsOptional()
    userId?: number

    @IsOptional()
    include?: "user"
}