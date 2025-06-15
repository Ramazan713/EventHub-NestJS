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
    let app: INestApplication
    let jwtService: JwtService
    let prisma: PrismaService;
    let token: string

    beforeAll(async () => {
        app = global.app;
        jwtService = app.get(JwtService)
        prisma = app.get(PrismaService);
    })

    const createUserAndToken = async (payload: TokenPayload = baseTokenPayload) => {
        await createTestUser(prisma, payload)
        token = await jwtService.signAsync(payload)
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
            expect(ticket?.status).toBe(TicketStatus.RESERVED)
            expect(ticket?.priceAtPurchase).toBe(baseEvent.price)
            expect(event?.currentParticipants).toBe(1 + baseEvent.currentParticipants)
            expect(event?.tickets.length).toBe(1)
            expect(event?.tickets[0].userId).toBe(baseTokenPayload.sub)
            expect(event?.tickets[0].status).toBe(TicketStatus.RESERVED)
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

    })

    describe("Webhook", () => {
        let stripe: Stripe
        let baseSuccessPayload: string
        let baseFailedPayload: string
        let baseEventId: number
        let baseEvent: Event
        let baseOrganizerId: number
        let baseTicket: Ticket
        let baseUser: User

        beforeAll(() => {
            stripe = app.get(Stripe)
        })

        beforeEach(async () => {
            const organizer = await createTestUser(prisma, {sub: 1000, email: "organizer@gmail.com", role: Role.ORGANIZER})
            baseOrganizerId = organizer.id
            baseEvent = await createEvent({eventId: 100, organizerId: baseOrganizerId})
            baseEventId = baseEvent.id

            baseUser = await createTestUser(prisma, baseTokenPayload)
            baseTicket = await prisma.ticket.create({
                data: {
                    eventId: baseEventId,
                    userId: baseUser.id,
                    status: TicketStatus.RESERVED,
                    priceAtPurchase: 100
                }
            })
            baseSuccessPayload = PaymentTestUtils.getSuccessedPayload({ticketId: baseTicket.id, eventId: baseEventId})
            baseFailedPayload = PaymentTestUtils.getFailedPayload({ticketId: baseTicket.id, eventId: baseEventId})

        })

        const getSignature = (payload: string) => stripe.webhooks.generateTestHeaderString({
            payload,
            secret: process.env.STRIPE_WEBHOOK_SECRET!,
        })

        const execute = async (payload: string) => {
            return request(app.getHttpServer())
                .post("/events/webhook")
                .set("stripe-signature", getSignature(payload))
                .set("Content-Type", "application/json")
                .send(payload)
        }

        it("should update ticket status to BOOKED when payment is successful", async() => {
            const response = await execute( baseSuccessPayload)
            const ticket = await prisma.ticket.findFirst({where: {id: baseTicket.id}})

            expect(ticket?.status).toBe(TicketStatus.BOOKED)
            expect(response.status).toBe(200)
        })

        it("should increment event participants when payment is successful", async() => {
            const response = await execute(baseSuccessPayload)
            const event = await prisma.event.findFirst({where: {id: baseEventId}})
            expect(event?.currentParticipants).toBe(1 + baseEvent.currentParticipants)
            expect(response.status).toBe(200)
        })

        it("should update ticket status to CANCELLED when payment is failed", async() => {
            const response = await execute(baseFailedPayload)
            const ticket = await prisma.ticket.findFirst({where: {id: baseTicket.id}})

            expect(ticket?.status).toBe(TicketStatus.CANCELLED)
            expect(response.status).toBe(200)
        })

        it("should decrese event participants when payment is failed", async() => {
            const response = await execute(baseFailedPayload)
            const event = await prisma.event.findFirst({where: {id: baseEventId}})
            expect(event?.currentParticipants).toBe(baseEvent.currentParticipants - 1)
            expect(response.status).toBe(200)
        })

        it("should throw BadRequestException if ticket not found", async() => {
            const response = await execute(PaymentTestUtils.getFailedPayload({ticketId: baseTicket.id + 1, eventId: baseEventId}))
            expect(response.status).toBe(400)
        })

    })
})