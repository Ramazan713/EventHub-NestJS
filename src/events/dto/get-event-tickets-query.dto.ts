import { TicketStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional } from "class-validator";


export class GetEventTicketsQueryDto {

    @IsOptional()
    @IsEnum(TicketStatus)
    status?: TicketStatus

    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    userId?: number

    @IsOptional()
    include?: "user"
}