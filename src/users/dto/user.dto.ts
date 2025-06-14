
import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { Role, User } from '@prisma/client';

@Exclude()
export class UserDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  name?: string;

  @Expose()
  role: Role;

  @Expose()
  createdAt: Date;

  static fromUser(user: User): UserDto {
    return plainToInstance(UserDto, user)
  }
}