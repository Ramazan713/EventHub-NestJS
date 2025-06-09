import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TokenPayload } from 'src/auth/token-payload.interface';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {

    constructor(
        private usersService: UsersService
    ){}


    @UseGuards(JwtAuthGuard)
    @Get("me")
    me(
        @CurrentUser() user: TokenPayload
    ){
        return this.usersService.findUserByEmail(user.email)
    }
}
