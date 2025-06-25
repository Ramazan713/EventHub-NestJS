import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Reflector } from "@nestjs/core";
import { AuthType } from "../enums/auth-type.enum";
import { AUTH_TYPE_KEY } from "../decorators/auth.decorator";
import { GqlContextType, GqlExecutionContext } from "@nestjs/graphql";

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

        const isGraphQLSubscription = context.getType<GqlContextType>() === 'graphql' && 
                               GqlExecutionContext.create(context).getInfo().operation.operation === 'subscription';

        if (isGraphQLSubscription) {
            return this.canActivateSubscription(context); 
        }

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

    private async canActivateSubscription(context: ExecutionContext): Promise<boolean> {
        const ctx = GqlExecutionContext.create(context);
        const req = ctx.getContext().req
        
        const authTypes = this.reflector.getAllAndOverride<AuthType[]>(AUTH_TYPE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]) || [AuthGuard.defaultAuthType];

        if (authTypes.includes(AuthType.None)) {
            return true;
        }

        if (authTypes.includes(AuthType.Bearer)) {
            if (!req.user) {
                throw new UnauthorizedException('Subscription requires authentication');
            }
            return true;
        }

        return false;
    }
}