import { TicketStatus } from "@prisma/client"
import { Expose } from "class-transformer"


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
}