import { GetEventsQueryDto } from "@/events/dto/get-events-query.dto"
import { ParticipantStatus } from "@prisma/client"
import { IsEnum, IsOptional } from "class-validator"


export class GetUserEventsQueryDto extends GetEventsQueryDto{

    @IsOptional()
    @IsEnum(ParticipantStatus)
    status?: ParticipantStatus

    @IsOptional()
    include?: "organizer"

}