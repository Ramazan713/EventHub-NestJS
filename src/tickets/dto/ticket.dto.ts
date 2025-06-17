import { Ticket, TicketStatus } from "@prisma/client"
import { Exclude, Expose, plainToClass } from "class-transformer"


@Exclude()
export class TicketDto {
    @Expose()
    id: number

    @Expose()
    eventId: number
    
    @Expose()
    userId: number
    
    @Expose()
    status: TicketStatus
    
    @Expose()
    paymentIntentId?: string
    
    @Expose()
    failedReason?: string
    
    @Expose()
    priceAtPurchase: number

    @Expose()
    createdAt: Date
    
    @Expose()
    updatedAt: Date
    
    @Expose()
    refundedAt?: Date
    
    @Expose()
    paidAt?: Date


    static fromTicket(ticket: Ticket) {
        return plainToClass(TicketDto, ticket, { excludeExtraneousValues: true })
    }
}