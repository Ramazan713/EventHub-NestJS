import { SignUpInput } from "@/graphql-types"
import { IsEmail, IsString, MinLength } from "class-validator"


export class SignUpRequestDto implements SignUpInput{
    @IsEmail()
    email: string

    @IsString()
    @MinLength(6)
    password: string
}