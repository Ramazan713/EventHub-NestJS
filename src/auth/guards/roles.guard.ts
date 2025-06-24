import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@prisma/client";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { ActiveUserData } from "../interfaces/active-user-data.interface";
import { GqlContextType, GqlExecutionContext } from "@nestjs/graphql";


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

        const user: ActiveUserData = this.getRequest(context).user;
        return requiredRoles.some((role) => user.role == role)
    }



    private getRequest(context: ExecutionContext) {
        if(context.getType() === "http"){
            return context.switchToHttp().getRequest()
        }
        else if(context.getType<GqlContextType>() === "graphql"){
            return GqlExecutionContext.create(context).getContext().req
        }
    }
}