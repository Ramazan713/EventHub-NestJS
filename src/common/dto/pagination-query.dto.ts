import { Type } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsString, Min,  } from "class-validator";


export class PaginationQueryDto {

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    first?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    last?: number;

    @IsOptional()
    @IsString()
    after?: string;

    @IsOptional()
    @IsString()
    before?: string;
}