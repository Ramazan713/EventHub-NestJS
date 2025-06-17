import { PaymentEvenType } from '@/payments/enums/payment-even-type.enum';
import { CheckoutSession } from '@/payments/models/checkout.model';
import { WebhookRequest } from '@/payments/models/webhook-request.model';
import { PaymentsService } from '@/payments/payments.service';
import { PrismaService } from '@/prisma/prisma.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ParticipantStatus, Prisma, TicketStatus } from '@prisma/client';



@Injectable()
export class TicketsService {

    constructor(
        private prisma: PrismaService,
        private paymentsService: PaymentsService
    ){}


    async createTicket(eventId: number, userId: number): Promise<CheckoutSession> {
        const event = await this.prisma.event.findFirst({
            where: {
                id: eventId,
                isCancelled: false,
            },
            include: {
                tickets: {
                    where: {
                        status: {in: [TicketStatus.BOOKED, TicketStatus.RESERVED]},
                        userId
                    }
                }
            }
        })
        if(!event){
            throw new NotFoundException("event not found")
        }
        const userTickets = event.tickets.filter(ticket => ticket.userId === userId)
        if(userTickets.length > 0){
            const userTicket = userTickets[0]
            if(userTicket.status === TicketStatus.BOOKED){
                throw new BadRequestException("user already has a booked ticket")
            }
            else if(userTicket.status === TicketStatus.RESERVED){
                throw new BadRequestException("user has a reserved ticket")
            }
        }
        if(event.price === 0){
            throw new BadRequestException("event is free")
        }
        const reservedCount = event.tickets.filter(ticket => ticket.status === TicketStatus.RESERVED).length
        if(event.capacity && event.capacity <= event.currentParticipants + reservedCount){
            throw new BadRequestException("event is full")
        }
        return await this.prisma.$transaction(async (txn) => {
            const ticket = await txn.ticket.create({
                data: {
                    eventId,
                    userId,
                    status: TicketStatus.RESERVED,
                    priceAtPurchase: event.price
                }
            })
            await txn.event.update({
                where: {
                    id: eventId
                },
                data: {
                    tickets: {
                        connect: {
                            id: ticket.id
                        }
                    }
                }
            })
            const session = await this.paymentsService.createCheckoutSession(event, ticket.id)
            await txn.ticket.update({
                where: {
                    id: ticket.id
                },
                data: {
                    paymentSessionId: session.paymentSessionId,
                }
            })
            return session
        })
    }


    async cancelTicket(ticketId: number, userId: number){   
        const ticket = await this.prisma.ticket.findFirst({
            where: {
                id: ticketId,
                userId,
                status: TicketStatus.BOOKED
            }
        })
        if(!ticket){
            throw new NotFoundException("ticket not found")
        }
        const paymentIntentId = ticket.paymentIntentId
        if(!paymentIntentId){
            throw new BadRequestException("ticket is not paid")
        }  
        try {
            return await this.paymentsService.refundPayment(paymentIntentId)
        }catch(err){
            throw new BadRequestException()
        }
    }

    async handlePayment(
        webhookRequest: WebhookRequest
    ){
        try {
            const paymentResult = await this.paymentsService.parseWebhookRequest(webhookRequest)
            if(!paymentResult){
                return
            }
            const eventId = paymentResult.eventId
            const ticketId = paymentResult.ticketId
            const status = paymentResult.status
            const paymentIntentId = paymentResult.paymentIntentId
            const err = paymentResult.err

            if(paymentResult.eventType === PaymentEvenType.CHARGE && eventId != null && ticketId != null && paymentIntentId != null){
                await this.handlePaymentTicket({
                    eventId, ticketId, status, paymentIntentId, err
                })
            }
            if(paymentResult.eventType === PaymentEvenType.REFUND && paymentIntentId != null){
                await this.handleRefundPayment({paymentIntentId, status, err})
            }
        }catch(err){
            throw new BadRequestException()
        }
    }

    private async handleRefundPayment({
        paymentIntentId, status, err
    }: {
        paymentIntentId: string, 
        status: TicketStatus,
        err?: string | null
    }){
       
        await this.prisma.$transaction(async (txn) => {
             const ticketWhere: Prisma.TicketWhereUniqueInput = { paymentIntentId }
            if(status === TicketStatus.REFUNDED){
                ticketWhere.status = TicketStatus.BOOKED
            }
            const ticket = await txn.ticket.update({
                where: ticketWhere,
                data: {
                    status: status,
                    refundedAt: status === TicketStatus.REFUNDED ? new Date() : null,
                    failedReason: err
                }
            })
            await txn.event.update({
                where: {
                    id: ticket.eventId
                },
                data: {
                    currentParticipants: { decrement: status === TicketStatus.REFUNDED ? 1 : 0 }
                }
            })

            await txn.eventParticipant.upsert({
                where: {
                    userId_eventId: {
                        eventId: ticket.eventId,
                        userId: ticket.userId
                    }
                },
                update: {
                    status: ParticipantStatus.CANCELLED
                },
                create: {
                    eventId: ticket.eventId,
                    userId: ticket.userId,
                    status: ParticipantStatus.CANCELLED,
                }
            })
        })
    }

    private async handlePaymentTicket({
        eventId, ticketId, status, err, paymentIntentId
    }: {
        eventId: number,
        ticketId: number,
        status: TicketStatus,
        paymentIntentId: string,
        err?: string | null
    }){
        await this.prisma.$transaction(async (txn) => {
            const ticket = await txn.ticket.findFirst({
                where: {
                    eventId: eventId,
                    id: ticketId
                }
            })
            if(!ticket) throw new NotFoundException("ticket not found")
            let increment = status === TicketStatus.BOOKED ? 1 : 0
            if(ticket.status === status){
                increment = 0
            }

            await txn.event.update({
                where: {
                    id: eventId
                },
                data: {
                    currentParticipants: { increment }
                }
            })

            await txn.ticket.update({
                where: {
                    eventId: eventId,
                    id: ticketId
                },
                data: {
                    status: status,
                    paymentIntentId: paymentIntentId,
                    paidAt: status === TicketStatus.BOOKED ? new Date() : null,
                    failedReason: err,
                }
            })


            const eventParticipantStatus = status === TicketStatus.BOOKED ? ParticipantStatus.REGISTERED : ParticipantStatus.CANCELLED
            await txn.eventParticipant.upsert({
                where: {
                    userId_eventId: {
                        eventId: ticket.eventId,
                        userId: ticket.userId
                    }
                },
                update: {
                    status: eventParticipantStatus
                },
                create: {
                    eventId: ticket.eventId,
                    userId: ticket.userId,
                    status: eventParticipantStatus,
                    registeredAt: new Date()
                }
            })
        })
    }

}
