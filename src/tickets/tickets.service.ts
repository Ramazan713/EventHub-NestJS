import { CheckoutSession } from '@/payments/models/checkout.model';
import { WebhookRequest } from '@/payments/models/webhook-request.model';
import { PaymentsService } from '@/payments/payments.service';
import { PrismaService } from '@/prisma/prisma.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TicketStatus } from '@prisma/client';



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
                    currentParticipants: { increment: 1 },
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

    async handlePayment(
        webhookRequest: WebhookRequest
    ){
        try {
            const paymentResult = await this.paymentsService.parseWebhookRequest(webhookRequest)
            if(!paymentResult){
                return
            }
            await this.prisma.$transaction(async (txn) => {
                await txn.event.update({
                    where: {
                        id: paymentResult.eventId
                    },
                    data: {
                        currentParticipants: { increment: paymentResult.status === TicketStatus.BOOKED ? 1 : -1 }
                    }
                })

                await txn.ticket.update({
                    where: {
                        eventId: paymentResult.eventId,
                        id: paymentResult.ticketId
                    },
                    data: {
                        status: paymentResult.status,
                        paymentIntentId: paymentResult.paymentIntentId,
                        paidAt: paymentResult.status === TicketStatus.BOOKED ? new Date() : null,
                        failedReason: paymentResult.err,
                    }
                })
            })
        }catch(err){
            throw new BadRequestException()
        }
    }
}
