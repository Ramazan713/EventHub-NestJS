import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UsersService {

    constructor(
        private prisma: PrismaService
    ){}

    async findRawUserByEmail(email: string): Promise<User | null>{
        return await this.prisma.user.findUnique({
            where: {email}
        })
    }

    async findUserByEmail(email: string): Promise<UserDto | null>{
        const user = await this.findRawUserByEmail(email)
        if(!user){
            throw new NotFoundException("user not found")
        }
        return UserDto.fromUser(user)
    }

    async createUser(email: string, passwordHash: string): Promise<UserDto>{
        const user = await this.prisma.user.create({
            data: {
                email, passwordHash
            }
        })
        return UserDto.fromUser(user)
    }

}
