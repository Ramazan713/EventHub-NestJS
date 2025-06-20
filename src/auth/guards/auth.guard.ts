import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Reflector } from "@nestjs/core";
import { AuthType } from "../enums/auth-type.enum";
import { AUTH_TYPE_KEY } from "../decorators/auth.decorator";

@Injectable()
export class AuthGuard implements CanActivate {
    private static readonly defaultAuthType = AuthType.Bearer;
    private readonly authTypeGuardMap: Record<AuthType, CanActivate | CanActivate[]>

    constructor(
        private readonly jwtAuthGuard: JwtAuthGuard,
        private readonly reflector: Reflector
    ){
        this.authTypeGuardMap = {
            [AuthType.Bearer]: this.jwtAuthGuard,
            [AuthType.None]: { canActivate: () => true }
        }
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const authTypes = this.reflector.getAllAndOverride<AuthType[]>(AUTH_TYPE_KEY, [
            context.getHandler(),
            context.getClass()
        ]) || [AuthGuard.defaultAuthType]
        const guards = authTypes.map((authType) => this.authTypeGuardMap[authType]).flat()
        let error = new UnauthorizedException();

        for (const guard of guards) {
            if (guard) {
                const canActivate = await Promise.resolve(guard.canActivate(context))
                .catch((err) => {
                    error = err
                })
                if(canActivate) {
                    return true
                }
            }
        }
        throw error
    }
}