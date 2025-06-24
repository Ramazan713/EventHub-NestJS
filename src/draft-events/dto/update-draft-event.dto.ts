import * as GraphQLTypes from "@/graphql-types"
import { CreateDraftEventDto } from "./create-draft-event.dto"
import { PartialType } from "@nestjs/swagger"

export class UpdateDraftEventDto extends PartialType(CreateDraftEventDto) implements GraphQLTypes.UpdateDraftEventInput {

    
}