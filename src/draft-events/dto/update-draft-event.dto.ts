import { Type } from "class-transformer"
import { IsBoolean, IsDate, IsEnum, IsNumber, IsOptional, IsString, Max, MAX, MaxLength, Min, MinLength } from "class-validator"
import { EventCategory } from "@prisma/client"

export class UpdateDraftEventDto {

    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    title?: string

    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(250)
    description?: string

    @IsOptional()
    @IsEnum(EventCategory)
    category?: EventCategory

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    date?: Date

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(10000)
    price?: number

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(10000)
    capacity?: number

    @IsOptional()
    @IsBoolean()
    isOnline?: boolean

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    location?: string
}