import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { AuthCredentialsDto } from './dto/user-credentials.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {

    constructor(
        private usersService: UsersService
    ){

    }

    async signUp(authCredentials: AuthCredentialsDto){
        const { email, password } = authCredentials
        const user = await this.usersService.findUserByEmail(email)
        if(user){
            throw new BadRequestException("user with given email already exists")
        }

        const salt = await bcrypt.genSalt()
        const hashedPassword = await bcrypt.hash(password, salt)

        return this.usersService.createUser(email, hashedPassword)
    }


    async login(authCredentials: AuthCredentialsDto){
        const { email, password } = authCredentials
        const user = await this.usersService.findUserByEmail(email)
        if(!user){
            throw new UnauthorizedException("user not found or credentials are incorrect")
        }
        const passwordMatch = await bcrypt.compare(password, user.passwordHash)
        if(!passwordMatch){
            throw new UnauthorizedException("user not found or credentials are incorrect")
        } 
        return user
    }

}
