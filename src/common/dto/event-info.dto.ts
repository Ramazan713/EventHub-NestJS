import { EventCategory } from "@prisma/client"
import { Expose, Type } from "class-transformer"
import { UserInfoDto } from "./user-info.dto"


export class EventInfoDto {
    @Expose()
    id: number

    @Expose()
    title: string

    @Expose()
    description: string

    @Expose()
    category: EventCategory

    @Expose()
    date: Date

    @Expose()
    updatedAt: Date

    @Expose()
    isOnline: boolean 

    @Expose()
    isCancelled: boolean 

    @Expose()
    location?: string

    @Expose()
    @Type(() => UserInfoDto)
    organizer?: UserInfoDto
}