import { Role } from "generated/prisma";


export interface TokenPayload {
    sub: number,
    email: string,
    role: Role
}