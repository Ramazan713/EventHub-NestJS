import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/auth/current-user.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { TokenPayload } from '@/auth/token-payload.interface';
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
