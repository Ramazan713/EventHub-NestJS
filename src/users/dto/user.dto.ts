
import { Role } from '@prisma/client';
import { Expose } from 'class-transformer';


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

}