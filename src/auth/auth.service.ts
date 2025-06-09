import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { AuthCredentialsDto } from './dto/user-credentials.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from 'generated/prisma';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ){

    }

    async signUp(authCredentials: AuthCredentialsDto): Promise<AuthResponseDto>{
        const { email, password } = authCredentials
        const user = await this.usersService.findUserByEmail(email)
        if(user){
            throw new BadRequestException("user with given email already exists")
        }

        const salt = await bcrypt.genSalt()
        const hashedPassword = await bcrypt.hash(password, salt)
        const createdUser = await this.usersService.createUser(email, hashedPassword)
        const token = await this.generateToken(createdUser)
        return {
            token,
            user: createdUser
        }
    }


    async login(authCredentials: AuthCredentialsDto): Promise<AuthResponseDto>{
        const { email, password } = authCredentials
        const user = await this.usersService.findUserByEmail(email)
        if(!user){
            throw new UnauthorizedException("user not found or credentials are incorrect")
        }
        const passwordMatch = await bcrypt.compare(password, user.passwordHash)
        if(!passwordMatch){
            throw new UnauthorizedException("user not found or credentials are incorrect")
        } 
        const token = await this.generateToken(user)
        return {
            token,
            user: user
        }
    }


    private async generateToken(user: User): Promise<string> {
        const payload = { sub: user.id, email: user.email }
        return this.jwtService.signAsync(payload)
    }

}
