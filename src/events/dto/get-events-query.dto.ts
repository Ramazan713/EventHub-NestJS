import { PaginationQueryDto } from "@/common/dto/pagination-query.dto"
import { SortOrder } from "@/common/enums/sort-order.enum"
import { IsBooleanString } from "@/common/pipes/boolean-transform.pipe"
import { EventCategory } from "@prisma/client"
import { Type } from "class-transformer"
import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, Min } from "class-validator"


export class GetEventsQueryDto extends PaginationQueryDto {
    
    @IsNotEmpty()
    @IsOptional()
    q?: string

    @IsEnum(EventCategory)
    @IsOptional()
    category?: EventCategory

    @IsBooleanString()
    @IsOptional()
    isOnline?: boolean

    @IsNotEmpty()
    @IsOptional()
    location?: string

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    dateFrom?: Date

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    dateTo?: Date

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @IsOptional()
    priceFrom?: number

    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @IsOptional()
    priceTo?: number

    @IsBooleanString()
    @IsOptional()
    isCancelled?: boolean

    @IsNumber()
    @IsPositive()
    @IsOptional()
    organizerId?: number

    @IsOptional()
    sortBy?: "date" | "price" | "id"

    @IsEnum(SortOrder)
    @IsOptional()
    sortOrder?: SortOrder
}