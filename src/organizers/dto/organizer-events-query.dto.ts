import { BaseEventsQueryDto } from "@/common/dto/base-events-query.dto";
import { IsBooleanString } from "@/common/pipes/boolean-transform.pipe";
import { IsOptional } from "class-validator";


export class OrganizerEventsQueryDto extends BaseEventsQueryDto {
    @IsBooleanString()
    @IsOptional()
    isCancelled?: boolean
}