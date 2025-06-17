import { Event, EventCategory, User } from "@prisma/client"
import { Exclude, Expose, plainToClass } from "class-transformer"
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

    static fromEvent(event: Event, organizer?: User): EventInfoDto & {organizer?: UserInfoDto} {
        const eventDto = plainToClass(EventInfoDto, event, { excludeExtraneousValues: true })
        if(organizer){
            return {
                ...eventDto,
                organizer: UserInfoDto.fromUser(organizer)
            }
        }
        return eventDto
    }
}