import { AuthPayload } from "@/graphql-types"
import { UserDto } from "@/users/dto/user.dto"

export class AuthResponseDto implements AuthPayload{
    user: UserDto
    token: string
}