import { Exclude, Expose, plainToInstance } from "class-transformer"
import { Event, EventCategory } from "../../../generated/prisma"

@Exclude()
export class EventDto {

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
    createdAt: Date

    @Expose()
    price: number

    @Expose()
    capacity?: number

    @Expose()
    isOnline: boolean 

    @Expose()
    isCancelled: boolean 

    @Expose()
    location?: string

    @Expose()
    isPublished: boolean

    @Expose()
    organizerId: number

    static fromEvent(event: Event): EventDto {
        return plainToInstance(EventDto, event)
      }
}