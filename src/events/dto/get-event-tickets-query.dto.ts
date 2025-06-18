import { TicketStatus } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional } from "class-validator";


export class GetEventTicketsQueryDto {

    @IsOptional()
    @IsEnum(TicketStatus)
    status?: TicketStatus

    @IsOptional()
    @IsNumber()
    userId?: number

    @IsOptional()
    include?: "user"
}