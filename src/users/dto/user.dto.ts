
import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { User } from 'generated/prisma';

@Exclude()
export class UserDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  name?: string;

  @Expose()
  role: string;

  @Expose()
  createdAt: Date;

  static fromUser(user: User): UserDto {
    return plainToInstance(UserDto, user)
  }
}