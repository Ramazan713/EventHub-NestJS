import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "../../generated/prisma";
import { ROLES_KEY } from "./roles.decorator";
import { TokenPayload } from "./token-payload.interface";


@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector){}

    canActivate(context: ExecutionContext): boolean {

        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY,[
            context.getHandler(),
            context.getClass()
        ])
        if(!requiredRoles){
            return true
        }

        const user: TokenPayload = context.switchToHttp().getRequest().user;
        return requiredRoles.some((role) => user.role == role)
    }
}