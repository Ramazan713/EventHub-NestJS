import { Injectable } from '@nestjs/common';
import { User } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {

    constructor(
        private prisma: PrismaService
    ){}

    async findUserByEmail(email: string): Promise<User | null>{
        return await this.prisma.user.findUnique({
            where: {email}
        })
    }

    async createUser(email: string, passwordHash: string): Promise<User>{
        return await this.prisma.user.create({
            data: {
                email, passwordHash
            }
        })
    }

}
