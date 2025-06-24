import { PaginationQueryDto } from "@/pagination/dto/pagination-query.dto";
import {  UserTicketQueryInput } from "@/graphql-types";
import { Type } from "class-transformer";
import { IsDate, IsEnum, IsOptional } from "class-validator";
import { TicketStatus } from "@prisma/client";


export class GetUserTicketsQueryDto extends PaginationQueryDto implements UserTicketQueryInput{
    @IsOptional()
    @IsEnum(TicketStatus)
    status?: TicketStatus

    @IsOptional()
    include?: "event"

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    dateFrom?: Date

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    dateTo?: Date
    
}