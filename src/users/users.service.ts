import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
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
        return mapToDto(UserDto, user)
    }

    async createUser(email: string, passwordHash: string): Promise<UserDto>{
        const user = await this.prisma.user.create({
            data: {
                email, passwordHash
            }
        })
        return mapToDto(UserDto, user)
    }

}
