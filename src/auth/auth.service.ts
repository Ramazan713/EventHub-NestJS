import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from 'generated/prisma';
import { UserDto } from 'src/users/dto/user.dto';
import { UsersService } from 'src/users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { SignUpRequestDto } from './dto/signup-request.dto';


@Injectable()
export class AuthService {

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ){

    }

    async signUp(signUpRequestDto: SignUpRequestDto): Promise<AuthResponseDto>{
        const { email, password } = signUpRequestDto
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
            user: UserDto.fromUser(createdUser)
        }
    }


    async login(loginRequestDto: LoginRequestDto): Promise<AuthResponseDto>{
        const { email, password } = loginRequestDto
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
            user: UserDto.fromUser(user)
        }
    }


    private async generateToken(user: User): Promise<string> {
        const payload = { sub: user.id, email: user.email }
        return this.jwtService.signAsync(payload)
    }

}
