import { ExecutionContext, Injectable } from "@nestjs/common";
import { GqlContextType, GqlExecutionContext } from "@nestjs/graphql";
import { AuthGuard } from "@nestjs/passport";


@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt"){

    getRequest(context: ExecutionContext) {
        if(context.getType<GqlContextType>() === "graphql"){
            return GqlExecutionContext.create(context).getContext().req
        }
        return super.getRequest(context)
    }

}