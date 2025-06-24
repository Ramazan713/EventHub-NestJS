import { BaseEventsQueryDto } from "@/common/dto/base-events-query.dto";
import { IsBooleanString } from "@/common/pipes/boolean-transform.pipe";
import { OrganizerEventsQueryInput } from "@/graphql-types";
import { IsOptional } from "class-validator";


export class OrganizerEventsQueryDto extends BaseEventsQueryDto implements OrganizerEventsQueryInput{
    @IsBooleanString()
    @IsOptional()
    isCancelled?: boolean
}