import { DateUtils } from "@/common/date.utils";
import { EventSortBy } from "@/common/enums/event-sort-by.enum";
import { SortOrder } from "@/common/enums/sort-order.enum";
import { OrganizerEventsQueryDto } from "@/organizers/dto/organizer-events-query.dto";
import { Event, EventCategory, Role, User } from "@prisma/client";
import { E2eHelper } from "@test/utils/e2e-helper";
import * as request from 'supertest';



describe("Organizers", () => {
    let helper: E2eHelper

    beforeAll(async () => {
        app = global.app;
        helper = new E2eHelper()
    })


    describe("getEvents", () => {
        let organizer1: User
        let event1: Event
        let event2: Event
        let event3: Event
        let event4: Event
        let event5: Event
        let event6: Event
        
        beforeAll(async () => {
            helper.disabledEachResetDb()
            organizer1 = await helper.createOrganizerAndToken()
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
        })

        afterAll(async () => {
            await helper.enabledEachResetDb()
        })


        const execute = async (query: OrganizerEventsQueryDto = {}, token: string | null = helper.token) => {
            let requestExec = request(app.getHttpServer())
                .get(`/organizers/events`)
                .query(query)
            if(token) 
                requestExec = requestExec.set("Authorization", `Bearer ${token}`)
            return requestExec
                .send()
        }

        it("should return not expired and cancelled events by default", async () => {
            const response = await execute()
            expect(response.status).toBe(200)
            const data = response.body.data
            expect(data).toHaveLength(4)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event1.id, event2.id, event3.id, event6.id]))
        })

        it("should return events with given isOnline is true", async () => {
            const response = await execute({isOnline: true})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(3)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event2.id, event3.id, event6.id]))
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
            expect(data).toHaveLength(3)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event1.id, event3.id, event6.id]))
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
            expect(data).toHaveLength(4)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event1.id, event2.id, event3.id, event6.id]))
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
            expect(data).toHaveLength(1)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event1.id]))
        })

        it("should return events with given priceTo", async() => {
            const response = await execute({priceTo: 150})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(3)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event3.id, event2.id, event6.id, ]))
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
            expect(data).toHaveLength(4)
            expect(data.map(event => event.id)).toEqual(expect.arrayContaining([event1.id, event2.id, event3.id, event6.id]))
        })

        it("should return events with given sortBy date desc", async() => {
            const response = await execute({sortBy: EventSortBy.DATE, sortOrder: SortOrder.DESC})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(4)
            expect(data.map(event => event.id)).toEqual([event6.id, event3.id, event1.id, event2.id])
        })

        it("should return events with given sortBy date asc", async() => {
            const response = await execute({sortBy: EventSortBy.DATE, sortOrder: SortOrder.ASC})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(4)
            expect(data.map(event => event.id)).toEqual([event2.id, event1.id, event3.id, event6.id])
        })

        it("should return events with given sortBy price desc", async() => {
            const response = await execute({sortBy: EventSortBy.PRICE, sortOrder: SortOrder.DESC})
            const data = response.body.data
            expect(response.status).toBe(200)
            expect(data).toHaveLength(4)
            expect(data.map(event => event.id)).toEqual([event1.id, event2.id, event3.id, event6.id])
        })

        it("should throw ForbiddenException if user is not an organizer", async () => {
            await helper.generateAndSetToken({role: Role.USER})
            const response = await execute()
            expect(response.status).toBe(403)
            await helper.generateAndSetToken({role: Role.ORGANIZER})
        })

        it("should throw UnauthorizedException if token is null", async () => {
            const response = await execute({}, null)
            expect(response.status).toBe(401)
        })

    })

    describe("getEventById", () => {
        let baseOrganizer: User
        let otherOrganizer: User
        let event: Event
        let otherEvent: Event

        beforeAll(async () => {
            helper.disabledEachResetDb()
            baseOrganizer = await helper.createOrganizerAndToken()
            otherOrganizer = await helper.createOrganizator({email: "demo2@example.com", sub: 2000})
            event = await helper.createEvent({organizerId: baseOrganizer.id, id: 100})
            otherEvent = await helper.createEvent({organizerId: otherOrganizer.id, id: 101})
        })

        afterAll(async () => {
            await helper.enabledEachResetDb()
        })

        const execute = async ({id}:{id?: number} = {}, token: string | null = helper.token) => {
            let requestExec = request(app.getHttpServer())
                .get(`/organizers/events/${id ?? event.id}`)
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

        it("should throw UnauthorizedException if token is null", async () => {
            const response = await execute({}, null)
            expect(response.status).toBe(401)
        })

        it("should throw NotFoundException if organizer do not create event", async () => {
            const response = await execute({id: otherEvent.id})
            expect(response.status).toBe(404)
        })

        it("should throw ForbiddenException if user is not an organizer", async () => {
            await helper.generateAndSetToken({role: Role.USER})
            const response = await execute()
            expect(response.status).toBe(403)
            await helper.generateAndSetToken({role: Role.ORGANIZER})
        })
    })
})

