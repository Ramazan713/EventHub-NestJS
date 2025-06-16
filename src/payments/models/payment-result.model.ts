import { TicketStatus } from "@prisma/client"
import { PaymentEvenType } from "../enums/payment-even-type.enum"


export class PaymentResult {
    eventType: PaymentEvenType
    eventId?: number
    ticketId?: number
    status: TicketStatus
    paymentIntentId?: string
    err?: string | null
}