import { BaseEventsQueryDto } from "@/common/dto/base-events-query.dto";
import { IsBooleanString } from "@/common/pipes/boolean-transform.pipe";
import { ParticipantStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, Min } from "class-validator";


export class UserEventsQueryDto extends BaseEventsQueryDto {

    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @IsOptional()
    organizerId?: number

    @IsBooleanString()
    @IsOptional()
    isCancelled?: boolean
    
    @IsOptional()
    @IsEnum(ParticipantStatus)
    status?: ParticipantStatus

    @IsOptional()
    include?: "organizer"
}