import { DateUtils } from '@/common/date.utils';
import { PrismaService } from '@/prisma/prisma.service';
import { GetUserTicketsQueryDto } from '@/tickets/dto/get-user-tickets-query.dto';
import { INestApplication } from "@nestjs/common";
import { Event, ParticipantStatus, Prisma, Ticket, TicketStatus, User } from "@prisma/client";
import { E2eHelper } from '@test/utils/e2e-helper';
import { PaymentTestUtils } from '@test/utils/payment.utilts';
import * as request from 'supertest';

describe("Tickets", () => {
    let app: INestApplication
    let prisma: PrismaService;
    let helper: E2eHelper

    beforeAll(async () => {
        app = global.app;
        helper = new E2eHelper()
        prisma = app.get(PrismaService);
    })

    describe("create ticket",() => {
        let baseEvent: Event

        beforeEach(async () => {
            const organizer = await helper.createOrganizator()
            baseEvent = await helper.createEvent({id: 100, organizerId: organizer.id, price: 100})
        })

        const execute = async (eventId: number = baseEvent.id) => {
            return request(app.getHttpServer())
                .post("/events/" + eventId + "/tickets")
                .set("Authorization", `Bearer ${helper.token}`)
                .send()
        }

        it("should throw NotFoundException if event not found", async () => {
            await helper.createUserAndToken()
            const response = await execute(baseEvent.id + 1)
            expect(response.status).toBe(404)
        })

        it("should throw BadRequestException if user has already registered", async () => {
            await helper.createUserAndToken()
            await execute()
            const response = await execute()
            expect(response.status).toBe(400)
        })

         it("should throw BadRequestException if user has already Booked", async () => {
            await helper.createUserAndToken()
            await prisma.ticket.create({
                data: {
                    eventId: baseEvent.id,
                    userId: helper.baseTokenPayload.sub,
                    status: TicketStatus.BOOKED,
                    priceAtPurchase: 100
                }
            })
            const response = await execute()
            expect(response.status).toBe(400)
        })

        it("should throw NotFoundException if event is cancelled", async () => {
            await helper.createUserAndToken()
            await helper.createEvent({id: baseEvent.id + 1, isCancelled: true})
            const response = await execute(baseEvent.id + 1)
            expect(response.status).toBe(404)
        })

        it("should throw BadRequestException if price is free", async () => {
            await helper.createUserAndToken()
            await helper.createEvent({id: baseEvent.id + 1, price: 0})
            const response = await execute(baseEvent.id + 1)
            expect(response.status).toBe(400)
        })

       

        it("should throw BadRequestException if event is full with BOOKED", async () => {
            await helper.createUserAndToken()
            await helper.createEvent({id: baseEvent.id + 1, capacity: 1, currentParticipants: 0})
            await prisma.event.update({
                where: {
                    id: baseEvent.id + 1
                },
                data: {
                    tickets: {
                        create: {
                            userId: helper.baseTokenPayload.sub,
                            status: TicketStatus.BOOKED,
                            priceAtPurchase: 100
                        }
                    }
                }
            })
            const response = await execute(baseEvent.id + 1)
            expect(response.status).toBe(400)
        })

        it("should throw BadRequestException if event is full", async () => {
            await helper.createUserAndToken()
            await helper.createEvent({id: baseEvent.id + 1, capacity: 1, currentParticipants: 1})
            const response = await execute(baseEvent.id + 1)
            expect(response.status).toBe(400)
        })
        

        it("should create ticket and update event", async () => {
            await helper.createUserAndToken()
            const response = await execute()
            const ticket = await prisma.ticket.findFirst({where: {eventId: baseEvent.id, userId: helper.baseTokenPayload.sub}})
            const event = await prisma.event.findFirst({where: {id: baseEvent.id}, include: {tickets: true}})
           
            expect(response.status).toBe(201)
            expect(ticket).not.toBeNull()
            expect(ticket!!.status).toBe(TicketStatus.RESERVED)
            expect(ticket!!.priceAtPurchase).toBe(baseEvent.price)
            expect(event?.tickets.length).toBe(1)
            expect(ticket!!.userId).toBe(helper.baseTokenPayload.sub)
            expect(ticket!!.status).toBe(TicketStatus.RESERVED)
            expect(ticket!!.paymentSessionId).not.toBeNull()
            expect(ticket!!.paymentSessionId).toEqual(response.body.paymentSessionId)
            expect(ticket!!.status).toBe(TicketStatus.RESERVED)
            expect(response.body).toHaveProperty("checkoutUrl")
        })

        it("should create ticket when user has cancelled ticket before", async () => {
            await helper.createUserAndToken()
            await prisma.ticket.create({
                data: {
                    eventId: baseEvent.id,
                    userId: helper.baseTokenPayload.sub,
                    status: TicketStatus.CANCELLED,
                    priceAtPurchase: 100
                }
            })
            const response = await execute()
            expect(response.status).toBe(201)
        })

        it("should not increase or decrease currentParticipants when create ticket success but handle webhook failed", async () => {
            await helper.createUserAndToken()
            const response = await execute()
            const firstEvent = await prisma.event.findFirst({where: {id: baseEvent.id}, include: {tickets: true}})
            const insertedTicket = firstEvent!!.tickets[0]
            const payload = PaymentTestUtils.getFailedPayload({ticketId: insertedTicket.id, eventId: baseEvent.id})

            const webhookResponse = await request(app.getHttpServer())
                .post("/events/webhook")
                .set("stripe-signature", helper.getSignature(payload))
                .send(payload)

            const lastEvent = await prisma.event.findFirst({where: {id: baseEvent.id}})

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
            const organizer = await helper.createOrganizator()
            baseEvent = await helper.createEvent({id: 100, organizerId: organizer.id, price: 100})
            baseUser = await helper.createUserAndToken()
        })

        const createBaseTicket = async (data: Partial<Prisma.TicketUncheckedCreateInput> = {}) => {
            baseTicket = await helper.createTicket({eventId: baseEvent.id, userId: baseUser.id, status: TicketStatus.BOOKED, ...data})
        }

        const execute = async (ticketId: number = baseTicket.id, sendToken = helper.token) => {
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
            await helper.createUser({sub: helper.baseTokenPayload.sub + 1, email: "userx@gmail.com"})
            await createBaseTicket({userId: helper.baseTokenPayload.sub + 1})
            const response = await execute()
            expect(response.status).toBe(404)
        })

        it("should throw BadRequestException if event date is sometime soon", async () => {
            await prisma.event.update({where: {id: baseEvent.id}, data: {
                date: DateUtils.addHours({hours: (process.env.CANCEL_TICKET_MIN_HOURS as unknown as number) - 1})
            }})
            await createBaseTicket()
            const response = await execute()
            expect(response.status).toBe(400)
        })

        it("should throw BadRequestException if event date is past", async () => {
            await prisma.event.update({where: {id: baseEvent.id}, data: {
                date: DateUtils.addHours({hours: -1})
            }})
            await createBaseTicket()
            const response = await execute()
            expect(response.status).toBe(400)
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
        let baseTicket: Ticket
        let baseUser: User
        let basePaymentIntentId: string

        beforeEach(async () => {
            basePaymentIntentId = "pi_123"
            const organizer = await helper.createOrganizator()
            baseEvent = await helper.createEvent({id: 100, organizerId: organizer.id})
            baseEventId = baseEvent.id

            baseUser = await helper.createUserAndToken()
        })

        const createBaseTicket = async (data: Partial<Prisma.TicketUncheckedCreateInput> & {status: TicketStatus}) => {
            baseTicket = await helper.createTicket({eventId: baseEvent.id, userId: baseUser.id, ...data})
            return baseTicket
        }

        const execute = async (payload: string) => {
            return request(app.getHttpServer())
                .post("/events/webhook")
                .set("stripe-signature", helper.getSignature(payload))
                .set("Content-Type", "application/json")
                .send(payload)
        }

        describe("payment.success", () => {
            it("should update ticket status to BOOKED when payment is successful", async() => {
                await createBaseTicket({status: TicketStatus.RESERVED})
                const baseSuccessPayload = PaymentTestUtils.getSuccessedPayload({ticketId: baseTicket.id, eventId: baseEventId})
                const response = await execute(baseSuccessPayload)
                const ticket = await prisma.ticket.findFirst({where: {id: baseTicket.id}})

                expect(ticket?.status).toBe(TicketStatus.BOOKED)
                expect(ticket?.paymentIntentId).not.toBeNull()
                expect(ticket?.paidAt).not.toBeNull()
                expect(response.status).toBe(200)
            })

            it("should create event participant when payment is successful", async() => {
                await createBaseTicket({status: TicketStatus.RESERVED})
                const baseSuccessPayload = PaymentTestUtils.getSuccessedPayload({ticketId: baseTicket.id, eventId: baseEventId})
                await execute(baseSuccessPayload)
                const event = await prisma.event.findFirst({where: {id: baseEventId}, include: {participants: true}})
                expect(event?.participants.length).toBe(1)
                expect(event?.participants[0].userId).toBe(baseUser.id)
                expect(event?.participants[0].status).toBe(ParticipantStatus.REGISTERED)
            })

            it("when payment.success is called twice, should increment event participants once", async() => {
                await createBaseTicket({status: TicketStatus.RESERVED})
                const payload = PaymentTestUtils.getSuccessedPayload({ticketId: baseTicket.id, eventId: baseEventId})
                const response = await execute(payload)
                await execute(payload)
                const event = await prisma.event.findFirst({where: {id: baseEventId}})

                expect(event?.currentParticipants).toBe(baseEvent.currentParticipants + 1)
                expect(response.status).toBe(200)
            })

            it("should increment event participants when payment is successful", async() => {
                await createBaseTicket({status: TicketStatus.RESERVED})
                const baseSuccessPayload = PaymentTestUtils.getSuccessedPayload({ticketId: baseTicket.id, eventId: baseEventId})
                const response = await execute(baseSuccessPayload)
                const event = await prisma.event.findFirst({where: {id: baseEventId}})
          
                expect(event?.currentParticipants).toBe(1 + baseEvent.currentParticipants)
                expect(response.status).toBe(200)
            })
        })

        describe("payment.failed", () => {
            it("should update ticket status to CANCELLED when payment is failed", async() => {
                await createBaseTicket({status: TicketStatus.RESERVED})
                const baseFailedPayload = PaymentTestUtils.getFailedPayload({ticketId: baseTicket.id, eventId: baseEventId})
                const response = await execute(baseFailedPayload)
                const ticket = await prisma.ticket.findFirst({where: {id: baseTicket.id}})

                expect(ticket?.status).toBe(TicketStatus.CANCELLED)
                expect(ticket?.paymentIntentId).not.toBeNull()
                expect(ticket?.paidAt).toBeNull()
                expect(response.status).toBe(200)
            })

            it("should decrese event participants when payment is failed", async() => {
                await createBaseTicket({status: TicketStatus.RESERVED})
                const baseFailedPayload = PaymentTestUtils.getFailedPayload({ticketId: baseTicket.id, eventId: baseEventId})
                const response = await execute(baseFailedPayload)
                const event = await prisma.event.findFirst({where: {id: baseEventId}})
                expect(event?.currentParticipants).toBe(baseEvent.currentParticipants)
                expect(response.status).toBe(200)
            })

            it("should cancel event participants when payment is failed", async() => {
                await createBaseTicket({status: TicketStatus.RESERVED})
                const baseFailedPayload = PaymentTestUtils.getFailedPayload({ticketId: baseTicket.id, eventId: baseEventId})
                const response = await execute(baseFailedPayload)
                const event = await prisma.event.findFirst({where: {id: baseEventId}, include: {participants: true}})
                expect(event?.participants.length).toBe(1)
                expect(event?.participants[0].status).toBe(ParticipantStatus.CANCELLED)
                expect(response.status).toBe(200)
            })

            it("should throw BadRequestException if ticket not found", async() => {
                await createBaseTicket({status: TicketStatus.RESERVED})
                const response = await execute(PaymentTestUtils.getFailedPayload({ticketId: baseTicket.id + 1, eventId: baseEventId}))
                expect(response.status).toBe(400)
            })
        })

        describe("refund.created", () => {
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

            it("should update ticket status to REFUNDED when refund is successful and ticketStatus is REFUND_REQUESTED", async() => {
                await createBaseTicket({status: TicketStatus.REFUND_REQUESTED})
                const payload = PaymentTestUtils.getRefundCreatedPayload(basePaymentIntentId)
                const response = await execute(payload)
                const ticket = await prisma.ticket.findFirst({where: {id: baseTicket.id}})
                const event = await prisma.event.findFirst({where: {id: baseEventId}})

                expect(event?.currentParticipants).toBe(baseEvent.currentParticipants - 1)
                expect(ticket?.status).toBe(TicketStatus.REFUNDED)
                expect(ticket?.refundedAt).not.toBeNull()
                expect(response.status).toBe(200)
            })

            it("should cancel event participants when refund is successful", async() => {
                await createBaseTicket({status: TicketStatus.BOOKED})
                const payload = PaymentTestUtils.getRefundCreatedPayload(basePaymentIntentId)
                await execute(payload)
                const event = await prisma.event.findFirst({where: {id: baseEventId}, include: {participants: true}})
                expect(event?.participants.length).toBe(1)
                expect(event?.participants[0].status).toBe(ParticipantStatus.CANCELLED)
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
        })

        describe("refund.failed", () => {
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


    describe("getUserTickets", () => {
        let baseUser: User
        let baseOrganizer: User
        let ticket1: Ticket
        let ticket2: Ticket
        let ticket3: Ticket
        let ticket4: Ticket
        let ticket5: Ticket
        let ticket6: Ticket
        

        beforeAll(async () => {
            helper.disabledEachResetDb()
            baseOrganizer = await helper.createOrganizator()
            const event = await helper.createEvent({organizerId: baseOrganizer.id, id: 100, date: DateUtils.addHours({hours: 3})})
            const event2 = await helper.createEvent({organizerId: baseOrganizer.id, id: 101, date: DateUtils.addHours({hours: 1})})
            const event3 = await helper.createEvent({organizerId: baseOrganizer.id, id: 102, date: DateUtils.addHours({hours: -1})})

            baseUser = await helper.createUserAndToken()

            ticket1 = await helper.createTicket({eventId: event.id, userId: baseUser.id, status: TicketStatus.BOOKED, paymentIntentId: "p0"})
            ticket2 = await helper.createTicket({eventId: event2.id, userId: baseUser.id, status: TicketStatus.BOOKED, paymentIntentId: "p1"})
            ticket3 = await helper.createTicket({eventId: event3.id, userId: baseUser.id, status: TicketStatus.BOOKED, paymentIntentId: "p2"})
            ticket4 = await helper.createTicket({eventId: event.id, userId: baseUser.id, status: TicketStatus.CANCELLED, paymentIntentId: "p3"})
            ticket5 = await helper.createTicket({eventId: event.id, userId: baseUser.id, status: TicketStatus.REFUNDED, paymentIntentId: "p4"})
            ticket6 = await helper.createTicket({eventId: event.id, userId: baseUser.id, status: TicketStatus.REFUND_FAILED, paymentIntentId: "p5"})
        })

        afterAll(async () => {
            await helper.enabledEachResetDb()
        })

        const execute = async (query: GetUserTicketsQueryDto = {}) => {
            return request(app.getHttpServer())
                .get("/tickets")
                .query(query)
                .set("Authorization", `Bearer ${helper.token}`)
                .send()
        }

        it("should return not expired tickets as default", async() => {
            const response = await execute()
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(5)
            expect(data[0].event).toBeUndefined()
        })

        it("should return REFUNDED when status is REFUNDED", async() => {
            const response = await execute({status: TicketStatus.REFUNDED})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(1)
            expect(data[0].id).toBe(ticket5.id)
        })

        it("should return tickets with dateFrom query", async() => {
            const response = await execute({dateFrom: DateUtils.addHours({hours: 2})})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(4)
        })

        it("should return tickets with dateTo query", async() => {
            const response = await execute({dateTo: DateUtils.addHours({hours: 2})})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(1)
            expect(data[0].id).toBe(ticket2.id)
        })

        it("should return tickets with dateTo and dateFrom query", async() => {
            const response = await execute({dateTo: DateUtils.addHours({hours: 2}), dateFrom: DateUtils.addHours({hours: -2})})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(2)
            expect(data[0].id).toBe(ticket2.id)
            expect(data[1].id).toBe(ticket3.id)
        })

        it("should return tickets with event property when include param contains event", async() => {
            const response = await execute({include: "event"})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data[0].event).not.toBeNull()
            expect(data[0].event.organizer).not.toBeNull()
        })
    })

})