import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "./auth.service";
import { UserDto } from '@/users/dto/user.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy){

    constructor(private authService: AuthService) {
        super({
            usernameField: "email"
        });
    }

    async validate(email: string, password: string): Promise<UserDto> {
        return await this.authService.validateUser(email, password)
    }

}