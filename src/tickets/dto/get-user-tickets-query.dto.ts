import { PaginationQueryDto } from "@/common/dto/pagination-query.dto";
import { TicketStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDate, IsDateString, IsEnum, IsOptional } from "class-validator";


export class GetUserTicketsQueryDto extends PaginationQueryDto {
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