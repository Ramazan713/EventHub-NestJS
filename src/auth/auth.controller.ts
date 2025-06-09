import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpRequestDto } from './dto/signup-request.dto';
import { LoginRequestDto } from './dto/login-request.dto';

@Controller('auth')
export class AuthController {

    constructor(
        private authService: AuthService
    ){

    }

    @HttpCode(201)
    @Post("signUp")
    async signUp(
        @Body() signUpRequestDto: SignUpRequestDto
    ){
        return this.authService.signUp(signUpRequestDto)
    }

    @HttpCode(200)
    @Post("login")
    async login(
        @Body() loginRequestDto: LoginRequestDto
    ){
        return this.authService.login(loginRequestDto)
    }

}
