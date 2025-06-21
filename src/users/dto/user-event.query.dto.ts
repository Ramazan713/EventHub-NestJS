import { IsOptional } from "class-validator";


export class UserEventQueryDto {
    @IsOptional()
    include?: "organizer"
}