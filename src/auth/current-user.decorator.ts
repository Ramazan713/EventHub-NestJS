import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { TokenPayload } from "./token-payload.interface";


const getCurrentUserByContext = (context: ExecutionContext): TokenPayload | undefined => {
    if(context.getType() === "http"){
        return context.switchToHttp().getRequest().user
    }
}

export const CurrentUser = createParamDecorator<TokenPayload|undefined>((data, context) => {
    return getCurrentUserByContext(context)
})