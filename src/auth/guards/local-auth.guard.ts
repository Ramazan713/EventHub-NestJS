import { ExecutionContext, Injectable } from "@nestjs/common";
import { GqlContextType, GqlExecutionContext } from "@nestjs/graphql";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class LocalAuthGuard extends AuthGuard("local"){


    getRequest(context: ExecutionContext) {
        if(context.getType<GqlContextType>() === "graphql"){
            const gqlExecutionContext = GqlExecutionContext.create(context);
            const gqlContext = gqlExecutionContext.getContext();
            const gqlArgs = gqlExecutionContext.getArgs();

            gqlContext.req.body = { ...gqlContext.req.body, ...gqlArgs };
            return gqlContext.req;
        }
        return super.getRequest(context)
    }

}