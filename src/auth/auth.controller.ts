import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/user-credentials.dto';

@Controller('auth')
export class AuthController {

    constructor(
        private authService: AuthService
    ){

    }

    @Post("signUp")
    async signUp(@Body() authCredentials: AuthCredentialsDto){
        return this.authService.signUp(authCredentials)
    }

    @Post("login")
    async login(@Body() authCredentials: AuthCredentialsDto){
        return this.authService.login(authCredentials)
    }

}
