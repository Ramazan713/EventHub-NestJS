import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { UserDto } from '@/users/dto/user.dto';
import { UsersService } from '@/users/users.service';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { AuthResponseDto } from './dto/auth-response.dto';
import { SignUpRequestDto } from './dto/signup-request.dto';
import { ActiveUserData } from './interfaces/active-user-data.interface';
import { HashingService } from './hashing/hashing.service';
import { LoginRequestDto } from './dto/login-request.dto';


@Injectable()
export class AuthService {

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private hashingService: HashingService
    ){

    }

    async signUp(signUpRequestDto: SignUpRequestDto): Promise<AuthResponseDto>{
        const { email, password } = signUpRequestDto
        const user = await this.usersService.findRawUserByEmail(email)
        if(user){
            throw new BadRequestException("user with given email already exists")
        }

        const hashedPassword = await this.hashingService.hash(password)
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

    async login2(data: LoginRequestDto): Promise<AuthResponseDto>{
        const validatedUser = await this.validateUser(data.email, data.password)

        const token = await this.generateToken(validatedUser)
        return {
            token,
            user: validatedUser
        }
    }

    async validateUser(email: string, password: string): Promise<UserDto> {
        const user = await this.usersService.findRawUserByEmail(email)
        if(!user){
            throw new UnauthorizedException("user not found or credentials are incorrect")
        }
        const passwordMatch = await this.hashingService.compare(password, user.passwordHash)
        if(!passwordMatch){
            throw new UnauthorizedException("user not found or credentials are incorrect")
        } 
        return mapToDto(UserDto, user)
    }


    private async generateToken(user: User | UserDto): Promise<string> {
        const payload: ActiveUserData = { sub: user.id, email: user.email, role: user.role }
        return this.jwtService.signAsync(payload)
    }

}
