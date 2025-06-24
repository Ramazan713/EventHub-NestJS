
import { Role, UserDetailInfo } from '@/graphql-types';
import { Expose } from 'class-transformer';


export class UserDto implements UserDetailInfo{
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