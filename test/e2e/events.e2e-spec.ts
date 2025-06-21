import { DateUtils } from '@/common/date.utils';
import { GetEventParticipantQueryDto } from '@/events/dto/get-event-participant-query.dto';
import { GetEventTicketsQueryDto } from '@/events/dto/get-event-tickets-query.dto';
import { PublicEventsQueryDto } from '@/events/dto/public-events-query.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { Event, EventCategory, EventParticipant, ParticipantStatus, Role, Ticket, TicketStatus, User } from "@prisma/client";
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

    describe("cancelEvent", () => {
        let baseEvent: Event
        let baseOrganizer: User

        beforeEach(async () => {
            baseOrganizer = await helper.createOrganizerAndToken()
            baseEvent = await helper.createEvent({id: 100, organizerId: baseOrganizer.id, isCancelled: false})
        })


        const execute = async (eventId: number = baseEvent.id) => {
            return request(app.getHttpServer())
                .post(`/events/${eventId}/cancel`)
                .set("Authorization", `Bearer ${helper.token}`)
                .send()
        }

        it("should cancel event", async () => {
            const response = await execute()
            expect(response.status).toBe(200)
            const event = await prisma.event.findUnique({where: {id: baseEvent.id}})
            expect(event!!.isCancelled).toBe(true)
        })

        it("should throw NotFoundException if event not found", async () => {
            const response = await execute(baseEvent.id + 1)
            expect(response.status).toBe(404)
        })

        it("should throw ForbiddenException if user is not organizer", async () => {
            await helper.generateAndSetToken({role: Role.USER})
            const response = await execute()
            expect(response.status).toBe(403)
        })

        it("should throw NotFoundException if event is cancelled", async () => {
            await helper.updateEvent(baseEvent.id, {isCancelled: true})
            const response = await execute(baseEvent.id)
            expect(response.status).toBe(404)
        })

        it("should delete draftEvents if exists", async () => {
            const draftEvent = await helper.createDraft({organizerId: baseOrganizer.id, originalEventId: baseEvent.id})
            const response = await execute()
            expect(response.status).toBe(200)

            const eventResponse = await prisma.draftEvent.findUnique({where: {id: draftEvent.id}})
            expect(eventResponse).toBeNull()
        })

        it("should refund payment for all booked tickets", async () => {
            const user2 = await helper.createUser({sub: helper.baseTokenPayload.sub + 1, email: "userx@gmail.com"})
            await helper.createTicket({eventId: baseEvent.id, userId: user2.id, status: TicketStatus.BOOKED, paymentIntentId: "px"})
            await helper.createTicket({eventId: baseEvent.id, userId: helper.baseTokenPayload.sub, status: TicketStatus.BOOKED, paymentIntentId: "py"})

            const response = await execute()
            expect(response.status).toBe(200)

            const tickets = await prisma.ticket.findMany({where: {eventId: baseEvent.id}})
            for(const ticket of tickets) {
                expect(ticket.status).toBe(TicketStatus.REFUND_REQUESTED)
            }                        
        })

        it("should throw BadRequestException if date is almost past", async () => {
            await helper.updateEvent(baseEvent.id, {date: DateUtils.addMinutes({minutes: 5})})
            const response = await execute()
            expect(response.status).toBe(400)
        })

    })


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

        beforeAll(async () => {
            helper.disabledEachResetDb()
            await helper.createOrganizerAndToken()
            eventId = await helper.createEvent({id: 100, organizerId: helper.baseTokenPayload.sub}).then(event => event.id)
            const user = await createTestUser(prisma, {role: Role.USER, sub: 10000, email: "demo@example.com"})
            await registerUser(eventId, user.id)
        })

        afterAll(async () => {
           await helper.enabledEachResetDb()
        })

        const execute = async (id: number = eventId) => {
            return request(app.getHttpServer())
                .get(`/events/${id}/participants`)
                .set("Authorization", `Bearer ${helper.token}`)
                .send()
        }

        it("should return participants", async () => {
            const response = await execute()
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(1)
        })

        it("should throw NotFoundException if event not found", async () => {
            const response = await execute(eventId + 1)
            expect(response.status).toBe(404)
        })

        it("should throw ForbiddenException if user is not an organizer", async () => {
            await helper.generateAndSetToken({role: Role.USER})
            const response = await execute(eventId)
            expect(response.status).toBe(403)
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
        

        beforeAll(async () => {
            helper.disabledEachResetDb()
            baseOrganizer = await helper.createOrganizerAndToken()
            baseEvent = await helper.createEvent({organizerId: baseOrganizer.id, id: 100, date: DateUtils.addHours({hours: 3})})

            baseUser = await helper.createUser({email: "demo@example.com", sub: 2})
            baseUser2 = await helper.createUser({email: "demo2@example.com", sub: 3})

            ticket1 = await helper.createTicket({eventId: baseEvent.id, userId: baseUser.id, status: TicketStatus.BOOKED, paymentIntentId: "p0"})
            ticket2 = await helper.createTicket({eventId: baseEvent.id, userId: baseUser2.id, status: TicketStatus.BOOKED, paymentIntentId: "p1"})
            ticket3 = await helper.createTicket({eventId: baseEvent.id, userId: baseUser.id, status: TicketStatus.CANCELLED, paymentIntentId: "p3"})
            ticket4 = await helper.createTicket({eventId: baseEvent.id, userId: baseUser2.id, status: TicketStatus.REFUNDED, paymentIntentId: "p4"})
        })

        afterAll(async () => {
            await helper.enabledEachResetDb()
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
            const data = response.body.data
            expect(data).toHaveLength(2)
            expect(data[0].id).toEqual(ticket1.id)
            expect(data[1].id).toEqual(ticket2.id)
        })

        it("should return tickets with given userId", async () => {
            const response = await execute(baseEvent.id, {userId: baseUser.id})
            expect(response.status).toBe(200)
            const data = response.body.data
            expect(data).toHaveLength(2)
            expect(data[0].id).toEqual(ticket1.id)
            expect(data[1].id).toEqual(ticket3.id)
        })

        it("should return tickets with user when include param contains user", async () => {
            const response = await execute(baseEvent.id, {include: "user"})
            expect(response.status).toBe(200)
            expect(response.body.data[0].user).not.toBeNull()
        })

        it("should return event tickets", async () => {
            const response = await execute()
            expect(response.status).toBe(200)
            const data = response.body.data
            expect(data).toHaveLength(4)
            expect(data[0].user).toBeUndefined()
        })

        it("should throw NotFoundException if event not found", async () => {
            const response = await execute(baseEvent.id + 1)
            expect(response.status).toBe(404)
        })

    })

    describe("getEventParticipants", () => {
        let baseEvent: Event
        let baseUser: User
        let baseUser2: User
        let baseOrganizer: User
        let participant1: EventParticipant
        let participant2: EventParticipant
        

        beforeAll(async () => {
            helper.disabledEachResetDb()
            baseOrganizer = await helper.createOrganizerAndToken()
            baseEvent = await helper.createEvent({organizerId: baseOrganizer.id, id: 100})

            baseUser = await helper.createUser({email: "demo@example.com", sub: 2})
            baseUser2 = await helper.createUser({email: "demo2@example.com", sub: 3})

            participant1 = await helper.createParticipant({eventId: baseEvent.id, userId: baseUser.id, status: ParticipantStatus.REGISTERED})
            participant2 = await helper.createParticipant({eventId: baseEvent.id, userId: baseUser2.id, status: ParticipantStatus.CANCELLED})
        })

        afterAll(async () => {
            await helper.enabledEachResetDb()
        })

        const execute = async (id: number = baseEvent.id, query: GetEventParticipantQueryDto = {}) => {
            return request(app.getHttpServer())
                .get(`/events/${id}/participants`)
                .query(query)
                .set("Authorization", `Bearer ${helper.token}`)
                .send()
        }

        it("should return participants with given status", async () => {
            const response = await execute(baseEvent.id, {status: ParticipantStatus.CANCELLED})
            expect(response.status).toBe(200)
            const data = response.body.data
            expect(data).toHaveLength(1)
            expect(data[0].id).toEqual(participant2.id)
        })

        it("should return participants with given userId", async () => {
            const response = await execute(baseEvent.id, {userId: baseUser.id})
            expect(response.status).toBe(200)
            const data = response.body.data
            expect(data).toHaveLength(1)
            expect(data[0].id).toEqual(participant1.id)
        })

        it("should return participants with user when include param contains user", async () => {
            const response = await execute(baseEvent.id, {include: "user"})
            expect(response.status).toBe(200)
            expect(response.body.data[0].user).not.toBeNull()
        })

        it("should return event participants", async () => {
            const response = await execute()
            expect(response.status).toBe(200)
            const data = response.body.data
            expect(data).toHaveLength(2)
            expect(data[0].user).toBeUndefined()
        })

        it("should throw NotFoundException if event not found", async () => {
            const response = await execute(baseEvent.id + 1)
            expect(response.status).toBe(404)
        })

        it("should throw ForbiddenException if user is not an organizer", async () => {
            await helper.generateAndSetToken({role: Role.USER})
            const response = await execute(baseEvent.id)
            expect(response.status).toBe(403)
            await helper.generateAndSetToken({role: Role.ORGANIZER})
        })

    })


    describe("getPublicEvents", () => {
        let organizer1: User
        let organizer2: User
        let event1: Event
        let event2: Event
        let event3: Event
        let event4: Event
        let event5: Event
        let event6: Event
        let event7: Event
        let event8: Event
        
        beforeAll(async () => {
            helper.disabledEachResetDb()
            organizer1 = await helper.createOrganizator()
            organizer2 = await helper.createOrganizator({email: "organizer2@gmail.com", sub: 2000})
            event1 = await helper.createEvent({
                organizerId: organizer1.id, 
                id: 100,
                category: EventCategory.CONCERT,
                price: 300,
                date: DateUtils.addHours({hours: 30}),
                isOnline: false,
                location: "locatin 1",
                title: "title 1",
                description: "description 1",
            })
            event2 = await helper.createEvent({
                organizerId: organizer1.id, 
                id: 101,
                category: EventCategory.WORKSHOP,
                price: 100,
                date: DateUtils.addHours({hours: 15}),
                isOnline: true,
                location: undefined,
                title: "NestJS",
                description: "NestJS description",
            })

            event3 = await helper.createEvent({
                organizerId: organizer1.id, 
                id: 102,
                category: EventCategory.WEBINAR,
                price: 0,
                date: DateUtils.addHours({hours: 40}),
                isOnline: true,
                location: "locatin 2",
                title: "Python",
                description: "Python description",
            })

            event4 = await helper.createEvent({
                organizerId: organizer1.id, 
                id: 103,
                category: EventCategory.OTHER,
                price: 150,
                date: DateUtils.addHours({hours: 5}),
                isOnline: true,
                isCancelled: true,
                location: "locatin 2",
                title: "JAVA",
                description: "JAVA description",
            })

            event5 = await helper.createEvent({
                organizerId: organizer1.id, 
                id: 104,
                category: EventCategory.WEBINAR,
                price: 50,
                date: DateUtils.addHours({hours: -10}),
                isOnline: true,
                location: "locatin 2",
                title: "C",
                description: "C description",
            })

            event6 = await helper.createEvent({
                organizerId: organizer1.id, 
                id: 107,
                category: EventCategory.WEBINAR,
                price: 0,
                date: DateUtils.addHours({hours: 40}),
                isOnline: true,
                location: "locatin 7",
                title: "C#",
                description: "C# description",
            })

            event7 = await helper.createEvent({
                organizerId: organizer2.id, 
                id: 111,
                category: EventCategory.WORKSHOP,
                price: 100,
                date: DateUtils.addHours({hours: 25}),
                isOnline: true,
                location: undefined,
                title: "NestJS",
                description: "NestJS description",
            })

            event8 = await helper.createEvent({
                organizerId: organizer2.id, 
                id: 112,
                category: EventCategory.MEETUP,
                price: 300,
                date: DateUtils.addHours({hours: 30}),
                isOnline: true,
                location: undefined,
                title: "Microservice",
                description: "Microservice description",
            })
        })

        afterAll(async () => {
            await helper.enabledEachResetDb()
        })

         const execute = async (query: PublicEventsQueryDto = {}, token: string | null = helper.token) => {
            let requestExec = request(app.getHttpServer())
                .get(`/events`)
                .query(query)
            
            if(token) 
                requestExec = requestExec.set("Authorization", `Bearer ${token}`)
            
            return requestExec
                .send()
        }

        it("should return events when token set", async () => {
            await helper.createUserAndToken()
            const response = await execute()
            expect(response.status).toBe(200)
        })

        it("should return not expired and cancelled events by default", async () => {
            const response = await execute()
            expect(response.status).toBe(200)
            const data = response.body.data
            expect(data).toHaveLength(6)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event1.id, event2.id, event3.id, event6.id, event7.id, event8.id]))
        })

        it("should return events with organizerId query", async () => {
            const response = await execute({organizerId: organizer2.id})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(2)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event7.id, event8.id]))
        })

        it("should return events with given isOnline is true", async () => {
            const response = await execute({isOnline: true})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(5)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event2.id, event3.id, event6.id, event7.id, event8.id]))
        })

        it("should return events with given isOnline is false", async () => {
            const response = await execute({isOnline: false})
            const data = response.body.data
            expect(data).toHaveLength(1)
            expect(data[0].id).toEqual(event1.id)
        })

        it("should return events with given category", async () => {
            const response = await execute({category: EventCategory.CONCERT})
            const data = response.body.data
            expect(data).toHaveLength(1)
            expect(data[0].id).toEqual(event1.id)
        })

        it("should return events with given dateTo and dateFrom query", async() => {
            const response = await execute({dateTo: DateUtils.addHours({hours: 35}), dateFrom: DateUtils.addHours({hours: 10})})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(4)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event1.id, event2.id, event7.id, event8.id]))
        })

        it("should return events with given dateTo query", async() => {
            const response = await execute({dateTo: DateUtils.addHours({hours: 20})})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(1)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event2.id]))
        })

        it("should return events with given dateFrom query", async() => {
            const response = await execute({dateFrom: DateUtils.addHours({hours: 20})})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(5)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event1.id, event3.id, event6.id, event7.id, event8.id]))
        })

        it("should return events with given title", async() => {
            const response = await execute({q: "NestJS"})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(2)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event2.id, event7.id]))
        })

        it("should return events with given description", async() => {
            const response = await execute({q: "description"})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(6)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event1.id, event2.id, event3.id, event6.id, event7.id, event8.id]))
        })

        it("should return events with given location", async() => {
            const response = await execute({location: "locatin"})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(3)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event1.id, event3.id, event6.id]))
        })

        it("should return events with given priceFrom", async() => {
            const response = await execute({priceFrom: 150})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(2)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event1.id, event8.id]))
        })

        it("should return events with given priceTo", async() => {
            const response = await execute({priceTo: 150})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(4)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event3.id, event2.id, event6.id, event7.id]))
        })

        it("should return events with given priceFrom and priceTo", async() => {
            const response = await execute({priceFrom: 100, priceTo: 3000})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(4)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event1.id, event2.id, event7.id, event8.id]))
        })

        it("should return events with given sortBy date desc", async() => {
            const response = await execute({sortBy: "date", sortOrder: "desc"})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(6)
            expect(data.map(event => event.id)).toEqual([event6.id, event3.id, event8.id, event1.id, event7.id, event2.id])
        })

        it("should return events with given sortBy date asc", async() => {
            const response = await execute({sortBy: "date", sortOrder: "asc"})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(6)
            expect(data.map(event => event.id)).toEqual([event2.id, event7.id, event1.id, event8.id, event3.id, event6.id])
        })

        it("should return events with given sortBy price desc", async() => {
            const response = await execute({sortBy: "price", sortOrder: "desc"})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(6)
            expect(data.map(event => event.id)).toEqual([event1.id, event8.id, event2.id, event7.id, event3.id, event6.id])
        })

    
        it("should return events with organizer when include param contains organizer", async() => {
            const response = await execute({include: "organizer"})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data[0].organizer.id).toBeDefined()
        })
    })
});