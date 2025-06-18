import { DateUtils } from '@/common/date.utils';
import { GetEventTicketsQueryDto } from '@/events/dto/get-event-tickets-query.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { Event, ParticipantStatus, Role, Ticket, TicketStatus, User } from "@prisma/client";
import { E2eHelper } from '@test/utils/e2e-helper';
import { createTestUser } from "@test/utils/test-helpers";
import { TestUtils } from "@test/utils/test-utils";
import * as request from 'supertest';


describe("Events", () => {
    let prisma: PrismaService;
    let helper: E2eHelper

    beforeAll(async () => {
        app = global.app;
        helper = new E2eHelper()
        prisma = app.get(PrismaService);
    })

    const registerUser = async (eventId: number, userId: number = helper.baseTokenPayload.sub) => {
        return prisma.event.update({
            where: {
                id: eventId
            },
            data: {
                participants: {
                    create: {
                        status: ParticipantStatus.REGISTERED,
                        userId
                    }
                },
                currentParticipants: { increment: 1 }
            }
        })
    }

    describe("event register",() => {
        let baseEventId: number

        beforeEach(async () => {
            const organizer = await helper.createOrganizator()
            baseEventId = await helper.createEvent({id: 100, organizerId: organizer.id, price: 0}).then(event => event.id)
        })
        const execute = async (eventId: number = baseEventId) => {
            return request(app.getHttpServer())
                .post(`/events/${eventId}/register`)
                .set("Authorization", `Bearer ${helper.token}`)
                .send()
        }

        it("should register user to event", async () => {
            await helper.createUserAndToken()
            const response = await execute()
            expect(response.status).toBe(200)
            const event = await prisma.event.findFirst({ where: { id: response.body.id } });
            expect(event).toMatchObject(TestUtils.omitDates(response.body));
            expect(event?.currentParticipants).toBe(1)
        })

        it("should register user to event when user unregister before", async () => {
            await helper.createUserAndToken()
            await prisma.event.update({
                where: {
                    id: baseEventId
                },
                data: {
                    participants: {
                        create: {
                            status: ParticipantStatus.CANCELLED,
                            userId: helper.baseTokenPayload.sub
                        }
                    }
                }
            })
            const response = await execute()
            expect(response.status).toBe(200)
        })

        it("should throw NotFoundException if event not found", async () => {
            await helper.createUserAndToken()
            const response = await execute(baseEventId + 1)
            expect(response.status).toBe(404)
        })

        it("should throw BadRequestException if user already registered", async () => {
            await helper.createUserAndToken()
            await execute()
            const response = await execute()
            expect(response.status).toBe(400)
        })

        it("should throw NotFoundException if event is cancelled", async () => {
            await helper.createUserAndToken()
            await helper.createEvent({id: baseEventId + 1, isCancelled: true})
            const response = await execute(baseEventId + 1)
            expect(response.status).toBe(404)
        })

        it("should throw BadRequestException if event is full", async () => {
            await helper.createUserAndToken()
            await helper.createEvent({id: baseEventId + 1, capacity: 1, currentParticipants: 1})
            const response = await execute(baseEventId + 1)
            expect(response.status).toBe(400)
        })

        it("should throw NotFoundException if price is not free", async () => {
            await helper.createUserAndToken()
            await helper.createEvent({id: baseEventId + 1, price: 1})
            const response = await execute(baseEventId + 1)
            expect(response.status).toBe(404)
        })
    })

    describe("event unregister",() => {
        let baseEventId: number

        beforeEach(async () => {
            const organizer = await helper.createOrganizator()
            baseEventId = await helper.createEvent({id: 100, capacity: 10, price: 0, organizerId: organizer.id}).then(event => event.id)
        })

        const execute = async (eventId: number = baseEventId) => {
            return request(app.getHttpServer())
                .post(`/events/${eventId}/unregister`)
                .set("Authorization", `Bearer ${helper.token}`)
                .send()
        }

        it("should unregister user from event", async () => {
            await helper.createUserAndToken()
            await registerUser(baseEventId)
            const response = await execute()
            expect(response.status).toBe(200)
            const event = await prisma.event.findFirst({ where: { id: response.body.id }, include: { participants: true } });
            expect(event?.currentParticipants).toBe(0)
            expect(event?.participants[0].status).toBe(ParticipantStatus.CANCELLED)
        })

        it("should throw NotFoundException if event not found", async () => {
            await helper.createUserAndToken()
            const response = await execute(baseEventId + 1)
            expect(response.status).toBe(404)
        })

        it("should throw BadRequestException if user is not registered", async () => {
            await helper.createUserAndToken()
            const response = await execute()
            expect(response.status).toBe(400)
        })

        it("should throw NotFoundException if event is cancelled", async () => {
            await helper.createUserAndToken()
            await helper.createEvent({id: baseEventId + 1, isCancelled: true})
            const response = await execute(baseEventId + 1)
            expect(response.status).toBe(404)
        })

        it("should throw NotFoundException if price is not free", async () => {
            await helper.createUserAndToken()
            await helper.createEvent({id: baseEventId + 1, price: 1})
            const response = await execute(baseEventId + 1)
            expect(response.status).toBe(404)
        })
    })


    describe("getParticipants",() => {
        let eventId: number

        const createEventAndRegisterRandomUser = async ({isCancelled, price}: {isCancelled?: boolean, price?: number} = {}) => {
            eventId = await helper.createEvent({id: 100, organizerId: helper.baseTokenPayload.sub, isCancelled, price}).then(event => event.id)
            const user = await createTestUser(prisma, {role: Role.USER, sub: 10000, email: "demo@example.com"})
            await registerUser(eventId, user.id)
        }

        const execute = async (id: number = eventId) => {
            return request(app.getHttpServer())
                .get(`/events/${id}/participants`)
                .set("Authorization", `Bearer ${helper.token}`)
                .send()
        }

        it("should return participants", async () => {
            await helper.createOrganizerAndToken()
            await createEventAndRegisterRandomUser()
            const response = await execute()
            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(1)
        })

        it("should throw NotFoundException if event not found", async () => {
            await helper.createOrganizerAndToken()
            const response = await execute(eventId + 1)
            expect(response.status).toBe(404)
        })

        it("should throw ForbiddenException if user is not an organizer", async () => {
            await helper.createUserAndToken()
            await createEventAndRegisterRandomUser()
            const response = await execute(eventId)
            expect(response.status).toBe(403)
        })

        it("should throw NotFoundException if event is cancelled", async () => {
            await helper.createOrganizerAndToken()
            await createEventAndRegisterRandomUser({isCancelled: true})
            const response = await execute(eventId)
            expect(response.status).toBe(404)
        })
    })


    describe("getEventTickets", () => {
        let baseEvent: Event
        let baseUser: User
        let baseUser2: User
        let baseOrganizer: User
        let ticket1: Ticket
        let ticket2: Ticket
        let ticket3: Ticket
        let ticket4: Ticket
        

        beforeEach(async () => {
            baseOrganizer = await helper.createOrganizerAndToken()
            baseEvent = await helper.createEvent({organizerId: baseOrganizer.id, id: 100, date: DateUtils.addHours({hours: 3})})

            baseUser = await helper.createUser({email: "demo@example.com", sub: 2})
            baseUser2 = await helper.createUser({email: "demo2@example.com", sub: 3})

            ticket1 = await helper.createTicket({eventId: baseEvent.id, userId: baseUser.id, status: TicketStatus.BOOKED, paymentIntentId: "p0"})
            ticket2 = await helper.createTicket({eventId: baseEvent.id, userId: baseUser2.id, status: TicketStatus.BOOKED, paymentIntentId: "p1"})
            ticket3 = await helper.createTicket({eventId: baseEvent.id, userId: baseUser.id, status: TicketStatus.CANCELLED, paymentIntentId: "p3"})
            ticket4 = await helper.createTicket({eventId: baseEvent.id, userId: baseUser2.id, status: TicketStatus.REFUNDED, paymentIntentId: "p4"})
        })

        const execute = async (id: number = baseEvent.id, query: GetEventTicketsQueryDto = {}) => {
            return request(app.getHttpServer())
                .get(`/events/${id}/tickets`)
                .query(query)
                .set("Authorization", `Bearer ${helper.token}`)
                .send()
        }

        it("should return tickets with given status", async () => {
            const response = await execute(baseEvent.id, {status: TicketStatus.BOOKED})
            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(2)
            expect(response.body[0].id).toEqual(ticket1.id)
            expect(response.body[1].id).toEqual(ticket2.id)
        })

        it("should return tickets with given userId", async () => {
            const response = await execute(baseEvent.id, {userId: baseUser.id})
            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(2)
            expect(response.body[0].id).toEqual(ticket1.id)
            expect(response.body[1].id).toEqual(ticket3.id)
        })

        it("should return tickets with user when include param contains user", async () => {
            const response = await execute(baseEvent.id, {include: "user"})
            expect(response.status).toBe(200)
            expect(response.body[0].user).not.toBeNull()
        })

        it("should return event tickets", async () => {
            const response = await execute()
            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(4)
            expect(response.body[0].user).toBeUndefined()
        })

        it("should throw NotFoundException if event not found", async () => {
            const response = await execute(baseEvent.id + 1)
            expect(response.status).toBe(404)
        })

    })

});