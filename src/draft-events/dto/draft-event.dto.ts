import { Exclude, Expose, plainToInstance } from "class-transformer"
import { DraftEvent, EventCategory } from "../../../generated/prisma"

@Exclude()
export class DraftEventDto {

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
    location?: string

    @Expose()
    organizerId: number

    @Expose()
    originalEventId?: number

    static fromDraftEvent(event: DraftEvent): DraftEventDto {
        return plainToInstance(DraftEventDto, event)
      }
}