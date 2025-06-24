import { LoginInput } from "@/graphql-types"
import { IsEmail, IsString, MinLength } from "class-validator"


export class LoginRequestDto implements LoginInput{
    @IsEmail()
    email: string

    @IsString()
    @MinLength(6)
    password: string
}