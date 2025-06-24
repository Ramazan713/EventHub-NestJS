import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { EventTicketsQueryInput, TicketStatus } from "@/graphql-types";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional } from "class-validator";


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