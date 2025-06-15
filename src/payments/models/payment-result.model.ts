import { TicketStatus } from "@prisma/client"


export class PaymentResult {
    eventId: number
    ticketId: number
    status: TicketStatus
}