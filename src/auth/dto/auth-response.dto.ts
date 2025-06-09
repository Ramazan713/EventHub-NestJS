import { UserDto } from "src/users/dto/user.dto";


export class AuthResponseDto {
    user: UserDto
    token: string
}