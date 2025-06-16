import { TokenPayload } from '@/auth/token-payload.interface';
import { DateUtils } from '@/common/date.utils';
import { PrismaService } from '@/prisma/prisma.service';
import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Event, EventCategory, Role, Ticket, TicketStatus, User } from "@prisma/client";
import { PaymentTestUtils } from '@test/utils/payment.utilts';
import { createTestUser } from "@test/utils/test-helpers";
import Stripe from 'stripe';
import * as request from 'supertest';

const baseTokenPayload = { sub: 2, email: "example2@gmail.com", role: Role.USER }

describe("Tickets", () => {
    let stripe: Stripe
    let app: INestApplication
    let jwtService: JwtService
    let prisma: PrismaService;
    let token: string

    beforeAll(async () => {
        app = global.app;
        jwtService = app.get(JwtService)
        prisma = app.get(PrismaService);
        stripe = app.get(Stripe)
    })

    const createUserAndToken = async (payload: TokenPayload = baseTokenPayload) => {
        const user = await createTestUser(prisma, payload)
        token = await jwtService.signAsync(payload)
        return user
    }

    const createEvent = async(
        {capacity, price, organizerId, eventId, currentParticipants, isCancelled}:{
            capacity?: number, price?: number, organizerId?: number, eventId?: number,
            currentParticipants?: number, isCancelled?: boolean
        } = {},
    ) => {
        return prisma.event.create({
            data: {
                id: eventId,
                category: EventCategory.OTHER,
                description: "test",
                isCancelled: isCancelled ?? false,
                isOnline: false,
                location: "test",
                organizerId: organizerId ?? baseTokenPayload.sub,
                capacity,
                date: DateUtils.addHours({hours: 3}),
                title: "test",
                price: price ?? 100,
                currentParticipants: currentParticipants ?? 10,
            },
        })        
    }

    const getSignature = (payload: string) => stripe.webhooks.generateTestHeaderString({
        payload,
        secret: process.env.STRIPE_WEBHOOK_SECRET!,
    })

    describe("create ticket",() => {
        let baseEventId: number
        let baseEvent: Event
        let baseOrganizerId: number

        beforeEach(async () => {
            const organizer = await createTestUser(prisma, {sub: 1000, email: "organizer@gmail.com", role: Role.ORGANIZER})
            baseOrganizerId = organizer.id
            baseEvent = await createEvent({eventId: 100, organizerId: baseOrganizerId})
            baseEventId = baseEvent.id
        })

        const execute = async (eventId: number = baseEventId) => {
            return request(app.getHttpServer())
                .post("/events/" + eventId + "/tickets")
                .set("Authorization", `Bearer ${token}`)
                .send()
        }

        it("should throw NotFoundException if event not found", async () => {
            await createUserAndToken()
            const response = await execute(baseEventId + 1)
            expect(response.status).toBe(404)
        })

        it("should throw BadRequestException if user has already registered", async () => {
            await createUserAndToken()
            await execute()
            const response = await execute()
            expect(response.status).toBe(400)
        })

         it("should throw BadRequestException if user has already Booked", async () => {
            await createUserAndToken()
            await prisma.ticket.create({
                data: {
                    eventId: baseEventId,
                    userId: baseTokenPayload.sub,
                    status: TicketStatus.BOOKED,
                    priceAtPurchase: 100
                }
            })
            const response = await execute()
            expect(response.status).toBe(400)
        })

        it("should throw NotFoundException if event is cancelled", async () => {
            await createUserAndToken()
            await createEvent({eventId: baseEventId + 1, isCancelled: true})
            const response = await execute(baseEventId + 1)
            expect(response.status).toBe(404)
        })

        it("should throw BadRequestException if price is free", async () => {
            await createUserAndToken()
            await createEvent({eventId: baseEventId + 1, price: 0})
            const response = await execute(baseEventId + 1)
            expect(response.status).toBe(400)
        })

       

        it("should throw BadRequestException if event is full with BOOKED", async () => {
            await createUserAndToken()
            await createEvent({eventId: baseEventId + 1, capacity: 1, currentParticipants: 0})
            await prisma.event.update({
                where: {
                    id: baseEventId + 1
                },
                data: {
                    tickets: {
                        create: {
                            userId: baseTokenPayload.sub,
                            status: TicketStatus.BOOKED,
                            priceAtPurchase: 100
                        }
                    }
                }
            })
            const response = await execute(baseEventId + 1)
            expect(response.status).toBe(400)
        })

        it("should throw BadRequestException if event is full", async () => {
            await createUserAndToken()
            await createEvent({eventId: baseEventId + 1, capacity: 1, currentParticipants: 1})
            const response = await execute(baseEventId + 1)
            expect(response.status).toBe(400)
        })
        

        it("should create ticket and update event", async () => {
            await createUserAndToken()
            const response = await execute()
            expect(response.status).toBe(201)
            const ticket = await prisma.ticket.findFirst({where: {eventId: baseEventId, userId: baseTokenPayload.sub}})
            const event = await prisma.event.findFirst({where: {id: baseEventId}, include: {tickets: true}})

            expect(ticket).not.toBeNull()
            expect(ticket!!.status).toBe(TicketStatus.RESERVED)
            expect(ticket!!.priceAtPurchase).toBe(baseEvent.price)
            expect(event?.tickets.length).toBe(1)
            expect(ticket!!.userId).toBe(baseTokenPayload.sub)
            expect(ticket!!.status).toBe(TicketStatus.RESERVED)
            expect(ticket!!.paymentSessionId).not.toBeNull()
            expect(ticket!!.paymentSessionId).toEqual(response.body.paymentSessionId)
            expect(ticket!!.status).toBe(TicketStatus.RESERVED)
            expect(response.body).toHaveProperty("checkoutUrl")
        })

        it("should create ticket when user has cancelled ticket before", async () => {
            await createUserAndToken()
            await prisma.ticket.create({
                data: {
                    eventId: baseEventId,
                    userId: baseTokenPayload.sub,
                    status: TicketStatus.CANCELLED,
                    priceAtPurchase: 100
                }
            })
            const response = await execute()
            expect(response.status).toBe(201)
        })

        it("should not increase or decrease currentParticipants when create ticket success but handle webhook failed", async () => {
            await createUserAndToken()
            const response = await execute()
            const firstEvent = await prisma.event.findFirst({where: {id: baseEventId}, include: {tickets: true}})
            const insertedTicket = firstEvent!!.tickets[0]
            const payload = PaymentTestUtils.getFailedPayload({ticketId: insertedTicket.id, eventId: baseEventId})

            const webhookResponse = await request(app.getHttpServer())
                .post("/events/webhook")
                .set("stripe-signature", getSignature(payload))
                .send(payload)

            const lastEvent = await prisma.event.findFirst({where: {id: baseEventId}})

            expect(response.status).toBe(201)
            expect(webhookResponse.status).toBe(200)
            expect(lastEvent?.currentParticipants).toBe(baseEvent.currentParticipants)
        })

    })

    describe("cancel ticket", () => {
        let baseTicket: Ticket
        let baseUser: User
        let baseEvent: Event

        beforeEach(async () => {
            const organizer = await createTestUser(prisma, {sub: 1000, email: "organizer@gmail.com", role: Role.ORGANIZER})
            baseEvent = await createEvent({eventId: 100, organizerId: organizer.id})
            baseUser = await createUserAndToken(baseTokenPayload)
        })

        const createBaseTicket = async ({eventId, userId, status, paymentIntentId}: {eventId?: number, userId?: number, status?: TicketStatus, paymentIntentId?: string | null} = {}) => {
            baseTicket = await prisma.ticket.create({
                data: {
                    eventId: eventId ?? baseEvent.id,
                    userId: userId ?? baseUser.id,
                    status: status ?? TicketStatus.BOOKED,
                    priceAtPurchase: 100,
                    paymentIntentId: paymentIntentId ?? "pi_123"
                }
            })
        }

        const execute = async (ticketId: number = baseTicket.id, sendToken = token) => {
            return request(app.getHttpServer())
                .post("/tickets/" + ticketId + "/cancel")
                .set("Authorization", `Bearer ${sendToken}`)
                .send()
        }

        it("should throw NotFoundException if ticket does not exist", async () => {
            await createBaseTicket()
            const response = await execute(baseTicket.id + 1)
            expect(response.status).toBe(404)
        })

        it("should throw NotFoundException if ticket status is not BOOKED", async () => {
            await createBaseTicket({status: TicketStatus.RESERVED})
            const response = await execute()
            expect(response.status).toBe(404)
        })

        it("should throw UnauthorizedException if token is invalid", async () => {
            await createBaseTicket()
            const response = await execute(baseTicket.id, "invalid")
            expect(response.status).toBe(401)
        })

        it("should throw NotFoundException if ticket belongs to another user", async () => {
            await createTestUser(prisma, {sub: baseTokenPayload.sub + 1, email: "userx@gmail.com", role: Role.USER})
            await createBaseTicket({userId: baseTokenPayload.sub + 1})
            const response = await execute()
            expect(response.status).toBe(404)
        })

        it("should return success code", async () => {
            await createBaseTicket()
            const response = await execute()
            expect(response.status).toBe(200)
        })


    })

    describe("Webhook", () => {
        let baseEventId: number
        let baseEvent: Event
        let baseOrganizerId: number
        let baseTicket: Ticket
        let baseUser: User
        let basePaymentIntentId: string

        beforeEach(async () => {
            basePaymentIntentId = "pi_123"
            const organizer = await createTestUser(prisma, {sub: 1000, email: "organizer@gmail.com", role: Role.ORGANIZER})
            baseOrganizerId = organizer.id
            baseEvent = await createEvent({eventId: 100, organizerId: baseOrganizerId})
            baseEventId = baseEvent.id

            baseUser = await createTestUser(prisma, baseTokenPayload)
        })

        const createBaseTicket = async ({eventId, userId, status, paymentIntentId}: {eventId?: number, userId?: number, status?: TicketStatus, paymentIntentId?: string | null} = {}) => {
            baseTicket = await prisma.ticket.create({
                data: {
                    eventId: eventId ?? baseEvent.id,
                    userId: userId ?? baseUser.id,
                    status: status ?? TicketStatus.RESERVED,
                    priceAtPurchase: 100,
                    paymentIntentId: paymentIntentId ?? basePaymentIntentId
                }
            })
            return baseTicket
        }

        const execute = async (payload: string) => {
            return request(app.getHttpServer())
                .post("/events/webhook")
                .set("stripe-signature", getSignature(payload))
                .set("Content-Type", "application/json")
                .send(payload)
        }

        it("should update ticket status to BOOKED when payment is successful", async() => {
            await createBaseTicket()
            const baseSuccessPayload = PaymentTestUtils.getSuccessedPayload({ticketId: baseTicket.id, eventId: baseEventId})
            const response = await execute(baseSuccessPayload)
            const ticket = await prisma.ticket.findFirst({where: {id: baseTicket.id}})

            expect(ticket?.status).toBe(TicketStatus.BOOKED)
            expect(ticket?.paymentIntentId).not.toBeNull()
            expect(ticket?.paidAt).not.toBeNull()
            expect(response.status).toBe(200)
        })

        it("when payment.success is called twice, should increment event participants once", async() => {
            await createBaseTicket()
            const payload = PaymentTestUtils.getSuccessedPayload({ticketId: baseTicket.id, eventId: baseEventId})
            const response = await execute(payload)
            await execute(payload)
            const event = await prisma.event.findFirst({where: {id: baseEventId}})

            expect(event?.currentParticipants).toBe(baseEvent.currentParticipants + 1)
            expect(response.status).toBe(200)
        })

        it("should increment event participants when payment is successful", async() => {
            await createBaseTicket()
            const baseSuccessPayload = PaymentTestUtils.getSuccessedPayload({ticketId: baseTicket.id, eventId: baseEventId})
            const response = await execute(baseSuccessPayload)
            const event = await prisma.event.findFirst({where: {id: baseEventId}})
            expect(event?.currentParticipants).toBe(1 + baseEvent.currentParticipants)
            expect(response.status).toBe(200)
        })

        it("should update ticket status to CANCELLED when payment is failed", async() => {
            await createBaseTicket()
            const baseFailedPayload = PaymentTestUtils.getFailedPayload({ticketId: baseTicket.id, eventId: baseEventId})
            const response = await execute(baseFailedPayload)
            const ticket = await prisma.ticket.findFirst({where: {id: baseTicket.id}})

            expect(ticket?.status).toBe(TicketStatus.CANCELLED)
            expect(ticket?.paymentIntentId).not.toBeNull()
            expect(ticket?.paidAt).toBeNull()
            expect(response.status).toBe(200)
        })

        it("should decrese event participants when payment is failed", async() => {
            await createBaseTicket()
            const baseFailedPayload = PaymentTestUtils.getFailedPayload({ticketId: baseTicket.id, eventId: baseEventId})
            const response = await execute(baseFailedPayload)
            const event = await prisma.event.findFirst({where: {id: baseEventId}})
            expect(event?.currentParticipants).toBe(baseEvent.currentParticipants)
            expect(response.status).toBe(200)
        })

        it("should throw BadRequestException if ticket not found", async() => {
            await createBaseTicket()
            const response = await execute(PaymentTestUtils.getFailedPayload({ticketId: baseTicket.id + 1, eventId: baseEventId}))
            expect(response.status).toBe(400)
        })

        
        it("should update ticket status to REFUNDED when refund is successful", async() => {
            await createBaseTicket({status: TicketStatus.BOOKED})
            const payload = PaymentTestUtils.getRefundCreatedPayload(basePaymentIntentId)
            const response = await execute(payload)
            const ticket = await prisma.ticket.findFirst({where: {id: baseTicket.id}})
            const event = await prisma.event.findFirst({where: {id: baseEventId}})

            expect(event?.currentParticipants).toBe(baseEvent.currentParticipants - 1)
            expect(ticket?.status).toBe(TicketStatus.REFUNDED)
            expect(ticket?.refundedAt).not.toBeNull()
            expect(response.status).toBe(200)
        })

         it("should decrease current participants once when refund is called twice", async() => {
            await createBaseTicket({status: TicketStatus.BOOKED})
            const payload = PaymentTestUtils.getRefundCreatedPayload(basePaymentIntentId)
            await execute(payload)
            await execute(payload)
            const event = await prisma.event.findFirst({where: {id: baseEventId}})

            expect(event?.currentParticipants).toBe(baseEvent.currentParticipants - 1)
        })

        it("should throw BadRequestException if REFUNDED ticket status is not BOOKED", async() => {
            await createBaseTicket({status: TicketStatus.RESERVED})
            const payload = PaymentTestUtils.getRefundCreatedPayload(basePaymentIntentId)
            const response = await execute(payload)
            expect(response.status).toBe(400)
        })

        it("should update ticket status to REFUND_FAILED when refund is failed", async() => {
            await createBaseTicket({status: TicketStatus.REFUNDED})
            const payload = PaymentTestUtils.getRefundFailedPayload(basePaymentIntentId)
            const response = await execute(payload)
            const ticket = await prisma.ticket.findFirst({where: {id: baseTicket.id}})
            const event = await prisma.event.findFirst({where: {id: baseEventId}})

            expect(ticket?.status).toBe(TicketStatus.REFUND_FAILED)
            expect(event?.currentParticipants).toBe(baseEvent.currentParticipants)
            expect(ticket?.refundedAt).toBeNull()
            expect(response.status).toBe(200)
        })

        it("should update ticket status to REFUND_FAILED when refund is failed and ticket status is not REFUNDED", async() => {
            await createBaseTicket({status: TicketStatus.CANCELLED})
            const payload = PaymentTestUtils.getRefundFailedPayload(basePaymentIntentId)
            const response = await execute(payload)
            const ticket = await prisma.ticket.findFirst({where: {id: baseTicket.id}})
            const event = await prisma.event.findFirst({where: {id: baseEventId}})

            expect(response.status).toBe(200)
            expect(ticket?.status).toBe(TicketStatus.REFUND_FAILED)
            expect(event?.currentParticipants).toBe(baseEvent.currentParticipants)
            expect(ticket?.refundedAt).toBeNull()
        })

        
    })
})