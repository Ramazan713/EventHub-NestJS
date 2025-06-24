import { PaginationQueryDto } from "@/pagination/dto/pagination-query.dto";
import { EventTicketsQueryInput } from "@/graphql-types";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional } from "class-validator";
import { TicketStatus } from "@prisma/client";


export class GetEventTicketsQueryDto extends PaginationQueryDto implements EventTicketsQueryInput{

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