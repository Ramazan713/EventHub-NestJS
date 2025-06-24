import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { ActiveUserData } from "../interfaces/active-user-data.interface";
import { GqlContextType, GqlExecutionContext } from "@nestjs/graphql";


const getActiveUserByContext = (context: ExecutionContext): ActiveUserData | undefined => {
    if(context.getType() === "http"){
        return context.switchToHttp().getRequest().user
    }
    else if(context.getType<GqlContextType>() === "graphql"){
        return GqlExecutionContext.create(context).getContext().req.user
    }
}

export const ActiveUser = createParamDecorator<ActiveUserData|undefined>((data, context) => {
    return getActiveUserByContext(context)
})