import { Role } from "@prisma/client";


export interface TokenPayload {
    sub: number,
    email: string,
    role: Role
}