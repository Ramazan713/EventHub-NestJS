import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { ActiveUserData } from "../interfaces/active-user-data.interface";


const getActiveUserByContext = (context: ExecutionContext): ActiveUserData | undefined => {
    if(context.getType() === "http"){
        return context.switchToHttp().getRequest().user
    }
}

export const ActiveUser = createParamDecorator<ActiveUserData|undefined>((data, context) => {
    return getActiveUserByContext(context)
})