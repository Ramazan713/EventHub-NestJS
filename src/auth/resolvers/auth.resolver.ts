import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from '../auth.service';
import { Auth } from '../decorators/auth.decorator';
import { LoginRequestDto } from '../dto/login-request.dto';
import { SignUpRequestDto } from '../dto/signup-request.dto';
import { AuthType } from '../enums/auth-type.enum';


@Auth(AuthType.None)
@Resolver()
export class AuthResolver {

    constructor(
        private authService: AuthService
    ){}

    
    @Mutation('login')
    async login(
        @Args("input") input: LoginRequestDto,
    ) {
       return this.authService.login2(input)
    }

    @Mutation("signUp")
    async signUp(
        @Args("input") input: SignUpRequestDto
    ) {
        return this.authService.signUp(input)
    }
}
