import { Expose } from "class-transformer";


export class UserInfoDto {
    @Expose()
    id: number;
    
    @Expose()
    email: string;
    
    @Expose()
    name?: string;
}