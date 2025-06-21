import { DateUtils } from "@/common/date.utils";
import { GetUserParticipantQueryDto } from "@/users/dto/get-user-participant-query.dto";
import { UserEventQueryDto } from "@/users/dto/user-event.query.dto";
import { UserEventsQueryDto } from "@/users/dto/user-events-query.dto";
import { Event, EventCategory, EventParticipant, ParticipantStatus, User } from "@prisma/client";
import { E2eHelper } from "@test/utils/e2e-helper";
import * as request from 'supertest';



describe("Users", () => {
    let helper: E2eHelper

    beforeAll(async () => {
        app = global.app;
        helper = new E2eHelper()
    })

    describe("getEventParticipants", () => {
        let baseEvent: Event
        let baseEvent2: Event
        let baseUser: User
        let baseOrganizer: User
        let participant1: EventParticipant
        let participant2: EventParticipant
        

        beforeAll(async () => {
            helper.disabledEachResetDb()
            baseOrganizer = await helper.createOrganizator()
            baseEvent = await helper.createEvent({organizerId: baseOrganizer.id, id: 100})
            baseEvent2 = await helper.createEvent({organizerId: baseOrganizer.id, id: 101})
            baseUser = await helper.createUserAndToken({email: "demo@example.com", sub: 2})

            participant1 = await helper.createParticipant({eventId: baseEvent.id, userId: baseUser.id, status: ParticipantStatus.REGISTERED})
            participant2 = await helper.createParticipant({eventId: baseEvent2.id, userId: baseUser.id, status: ParticipantStatus.CANCELLED})
        })

        afterAll(async () => {
            await helper.enabledEachResetDb()
        })

        const execute = async (query: GetUserParticipantQueryDto = {}) => {
            return request(app.getHttpServer())
                .get(`/users/participants`)
                .query(query)
                .set("Authorization", `Bearer ${helper.token}`)
                .send()
        }

        it("should return participants with given status", async () => {
            const response = await execute({ status: ParticipantStatus.CANCELLED })
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(1)
            expect(data[0].id).toEqual(participant2.id)
        })

        it("should return participants with given eventId", async () => {
            const response = await execute({ eventId: baseEvent2.id })
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(1)
            expect(data[0].id).toEqual(participant2.id)
        })

        it("should return participants with user when include param contains event", async () => {
            const response = await execute({ include: "event" })
            expect(response.status).toBe(200)
            expect(response.body.data[0].event).not.toBeNull()
        })

        it("should return event participants", async () => {
            const response = await execute()
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(2)
            expect(data[0].event).toBeUndefined()
        })
    })


    describe("GetUserEvents", () => {
        let baseOrganizer: User
        let baseOrganizer2: User
        let baseUser: User
        let event1: Event
        let event2: Event
        let event3: Event
        let event4: Event
        let event5: Event
        let event6: Event
        
        beforeAll(async () => {
            helper.disabledEachResetDb()
            baseOrganizer = await helper.createOrganizator()
            baseOrganizer2 = await helper.createOrganizator({email: "demo2@example.com", sub: 2})
            baseUser = await helper.createUserAndToken()

            event1 = await helper.createEvent({
                organizerId: baseOrganizer.id, 
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
                organizerId: baseOrganizer.id, 
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
                organizerId: baseOrganizer2.id, 
                id: 102,
                category: EventCategory.WEBINAR,
                price: 0,
                date: DateUtils.addHours({hours: 40}),
                isOnline: true,
                location: "locatin 2",
                title: "Python",
                description: "Python description",
            })

            event6 = await helper.createEvent({
                organizerId: baseOrganizer.id, 
                id: 107,
                category: EventCategory.WEBINAR,
                price: 0,
                date: DateUtils.addHours({hours: 40}),
                isOnline: true,
                location: "locatin 7",
                title: "C#",
                description: "C# description",
            })

            event4 = await helper.createEvent({
                organizerId: baseOrganizer.id, 
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
                organizerId: baseOrganizer.id, 
                id: 104,
                category: EventCategory.WEBINAR,
                price: 50,
                date: DateUtils.addHours({hours: -10}),
                isOnline: true,
                location: "locatin 2",
                title: "C",
                description: "C description",
            })

            await helper.createParticipant({eventId: event1.id, userId: baseUser.id, status: ParticipantStatus.REGISTERED})
            await helper.createParticipant({eventId: event2.id, userId: baseUser.id, status: ParticipantStatus.REGISTERED})
            await helper.createParticipant({eventId: event3.id, userId: baseUser.id, status: ParticipantStatus.REGISTERED})
            await helper.createParticipant({eventId: event4.id, userId: baseUser.id, status: ParticipantStatus.REGISTERED})
            await helper.createParticipant({eventId: event5.id, userId: baseUser.id, status: ParticipantStatus.REGISTERED})
            await helper.createParticipant({eventId: event6.id, userId: baseUser.id, status: ParticipantStatus.CANCELLED})
        })

        afterAll(async () => {
            await helper.enabledEachResetDb()
        })

        const execute = async (query: UserEventsQueryDto = {}) => {
            return request(app.getHttpServer())
                .get(`/users/events`)
                .query(query)
                .set("Authorization", `Bearer ${helper.token}`)
                .send()
        }


        it("should return events with organizerId query", async () => {
            const response = await execute({organizerId: baseOrganizer2.id})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(1)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event3.id]))
        })

        it("should return not expired, cancelled and registered events by default", async () => {
            const response = await execute()
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(3)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event1.id, event2.id, event3.id]))
            expect(data[0].organizer).not.toBeDefined()
        })

        it("should return events with given isOnline is true", async () => {
            const response = await execute({isOnline: true})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(2)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event2.id, event3.id]))
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
            expect(data).toHaveLength(2)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event1.id, event2.id]))
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
            expect(data).toHaveLength(2)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event1.id, event3.id]))
        })

        it("should return events with given title", async() => {
            const response = await execute({q: "NestJS"})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(1)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event2.id]))
        })

        it("should return events with given description", async() => {
            const response = await execute({q: "description"})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(3)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event1.id, event2.id, event3.id]))
        })

        it("should return events with given location", async() => {
            const response = await execute({location: "locatin"})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(2)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event1.id, event3.id]))
        })

        it("should return events with given priceFrom", async() => {
            const response = await execute({priceFrom: 150})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(1)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event1.id]))
        })

        it("should return events with given priceTo", async() => {
            const response = await execute({priceTo: 150})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(2)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event3.id, event2.id]))
        })

        it("should return events with given priceFrom and priceTo", async() => {
            const response = await execute({priceFrom: 100, priceTo: 3000})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(2)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event1.id, event2.id]))
        })

        it("should return events with given isCancelled is true", async() => {
            const response = await execute({isCancelled: true})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(1)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event4.id]))
        })

        it("should return events with given isCancelled is false", async() => {
            const response = await execute({isCancelled: false})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(3)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event1.id, event2.id, event3.id]))
        })

        it("should return events with given sortBy date desc", async() => {
            const response = await execute({sortBy: "date", sortOrder: "desc"})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(3)
            expect(data.map(event => event.id)).toEqual([event3.id, event1.id, event2.id])
        })

        it("should return events with given sortBy date asc", async() => {
            const response = await execute({sortBy: "date", sortOrder: "asc"})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(3)
            expect(data.map(event => event.id)).toEqual([event2.id, event1.id, event3.id])
        })

        it("should return events with given sortBy price desc", async() => {
            const response = await execute({sortBy: "price", sortOrder: "desc"})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(3)
            expect(data.map(event => event.id)).toEqual([event1.id, event2.id, event3.id])
        })

        it("should return events with given status", async() => {
            const response = await execute({status: ParticipantStatus.CANCELLED})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(1)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event6.id]))
        })

        it("should return events with organizer when include param contains organizer", async() => {
            const response = await execute({include: "organizer"})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data[0].organizer.id).toBeDefined()
        })

    })


    describe("GetUserEventById", () => {
        let baseUser: User
        let baseOrganizer: User
        let event: Event
        let otherEvent: Event

        beforeAll(async () => {
            helper.disabledEachResetDb()
            baseOrganizer = await helper.createOrganizator()
            baseUser = await helper.createUserAndToken()
            event = await helper.createEvent({organizerId: baseOrganizer.id, id: 100})
            otherEvent = await helper.createEvent({organizerId: baseOrganizer.id, id: 101})

            await helper.createParticipant({eventId: event.id, userId: baseUser.id, status: ParticipantStatus.REGISTERED})
        })

        afterAll(async () => {
            await helper.enabledEachResetDb()
        })

        const execute = async ({id, query}:{id?: number, query?: UserEventQueryDto} = {}, token: string | null = helper.token) => {
            let requestExec = request(app.getHttpServer())
                .get(`/users/events/${id ?? event.id}`)
                .query(query ?? {})
            if(token != null) 
                requestExec = requestExec.set("Authorization", `Bearer ${token ?? helper.token}`)
            return requestExec
                .send()
        }

        it("should return event with given id", async() => {
            const response = await execute()
            const data = response.body
            expect(response.status).toBe(200)
            expect(data.id).toBe(event.id)
        })

        it("should return 404 when event with given id not found", async() => {
            const response = await execute({id: 1000})
            expect(response.status).toBe(404)
        })

        it("should return event with given id and include organizer", async() => {
            const response = await execute({query: {include: "organizer"}})
            const data = response.body
            expect(response.status).toBe(200)
            expect(data.organizer.id).toBe(baseOrganizer.id)
        })

        it("should throw UnauthorizedException if token is null", async () => {
            const response = await execute({}, null)
            expect(response.status).toBe(401)
        })

        it("should throw NotFoundException if user do not register to event", async () => {
            const response = await execute({id: otherEvent.id})
            expect(response.status).toBe(404)
        })
    })

})