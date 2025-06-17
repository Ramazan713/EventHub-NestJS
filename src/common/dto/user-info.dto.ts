import { User } from "@prisma/client";
import { Exclude, Expose, plainToClass } from "class-transformer";


@Exclude()
export class UserInfoDto {
    @Expose()
    id: number;
    
    @Expose()
    email: string;
    
    @Expose()
    name?: string;

    static fromUser(user: User): UserInfoDto {
        return plainToClass(UserInfoDto, user, { excludeExtraneousValues: true })
    }
}