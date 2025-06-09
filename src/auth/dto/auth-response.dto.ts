import { User } from "generated/prisma";


export class AuthResponseDto {
    user: User
    token: string
}