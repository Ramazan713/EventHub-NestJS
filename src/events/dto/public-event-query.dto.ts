import { IsOptional } from "class-validator";


export class PublicEventQueryDto {

    @IsOptional()
    include?: "organizer"
}