import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from 'generated/prisma';
import { UserDto } from 'src/users/dto/user.dto';
import { UsersService } from 'src/users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { SignUpRequestDto } from './dto/signup-request.dto';
import { TokenPayload } from './token-payload.interface';


@Injectable()
export class AuthService {

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ){

    }

    async signUp(signUpRequestDto: SignUpRequestDto): Promise<AuthResponseDto>{
        const { email, password } = signUpRequestDto
        const user = await this.usersService.findRawUserByEmail(email)
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

    async login(user: UserDto): Promise<AuthResponseDto>{
        const token = await this.generateToken(user)
        return {
            token,
            user: user
        }
    }

    async validateUser(email: string, password: string): Promise<UserDto> {
        const user = await this.usersService.findRawUserByEmail(email)
        if(!user){
            throw new UnauthorizedException("user not found or credentials are incorrect")
        }
        const passwordMatch = await bcrypt.compare(password, user.passwordHash)
        if(!passwordMatch){
            throw new UnauthorizedException("user not found or credentials are incorrect")
        } 
        return UserDto.fromUser(user)
    }


    private async generateToken(user: User | UserDto): Promise<string> {
        const payload: TokenPayload = { sub: user.id, email: user.email }
        return this.jwtService.signAsync(payload)
    }

}
