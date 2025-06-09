import { Body, Controller, HttpCode, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpRequestDto } from './dto/signup-request.dto';
import { LocalAuthGuard } from './local-auth.guard';

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
    @UseGuards(LocalAuthGuard)
    @Post("login")
    async login(
        @Request() req
    ){
        return this.authService.login(req.user)
    }

}
