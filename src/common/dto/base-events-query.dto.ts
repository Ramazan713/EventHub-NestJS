import { SortOrder } from "@/common/enums/sort-order.enum"
import { IsBooleanString } from "@/common/pipes/boolean-transform.pipe"
import { BaseEventsQueryInput } from "@/graphql-types"
import { PaginationQueryDto } from "@/pagination/dto/pagination-query.dto"
import { EventCategory } from "@prisma/client"
import { Type } from "class-transformer"
import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, Min } from "class-validator"
import { EventSortBy } from "../enums/event-sort-by.enum"



export abstract class BaseEventsQueryDto extends PaginationQueryDto implements BaseEventsQueryInput{
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

    @IsEnum(EventSortBy)
    @IsOptional()
    sortBy?: EventSortBy

    @IsEnum(SortOrder)
    @IsOptional()
    sortOrder?: SortOrder
}