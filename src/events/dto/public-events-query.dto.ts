import { BaseEventsQueryDto } from "@/common/dto/base-events-query.dto";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, Min } from "class-validator";


export class PublicEventsQueryDto extends BaseEventsQueryDto{
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @IsOptional()
    organizerId?: number

    @IsOptional()
    include?: "organizer"
}