import { Type } from "class-transformer"
import { IsBoolean, IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MAX, MaxLength, Min, MinLength } from "class-validator"
import * as GraphQLTypes from "@/graphql-types"
import { EventCategory } from "@prisma/client"


export class CreateDraftEventDto implements GraphQLTypes.CreateDraftEventInput {

    @IsString()
    @MinLength(3)
    @MaxLength(50)
    title: string

    @IsString()
    @MinLength(3)
    @MaxLength(250)
    description: string

    @IsEnum(EventCategory)
    category: EventCategory

    @IsDate()
    @Type(() => Date)
    date: Date

    @IsNumber()
    @Min(0)
    @Max(10000)
    price: number

    @IsNumber()
    @Min(1)
    @Max(10000)
    @IsOptional()
    capacity?: number

    @IsBoolean()
    isOnline: boolean = true

    @IsString()
    @MinLength(2)
    @MaxLength(50)
    @IsOptional()
    location?: string
}