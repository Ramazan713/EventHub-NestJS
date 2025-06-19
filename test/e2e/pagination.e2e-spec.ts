import { DateUtils } from '@/common/date.utils';
import { GetEventsQueryDto } from '@/events/dto/get-events-query.dto';
import { INestApplication } from "@nestjs/common";
import { Event, User } from "@prisma/client";
import { E2eHelper } from '@test/utils/e2e-helper';
import * as request from 'supertest';

describe("Pagination", () => {
    let app: INestApplication
    let helper: E2eHelper

    beforeAll(async () => {
        app = global.app;
        helper = new E2eHelper()
    })


    describe("getEvents", () => {
        let baseOrganizer: User
        let event1: Event
        let event2: Event
        let event3: Event
        let event4: Event
        

        beforeAll(async () => {
            helper.disabledEachResetDb()
            baseOrganizer = await helper.createOrganizerAndToken()
            event1 = await helper.createEvent({organizerId: baseOrganizer.id, id: 100, price: 100, date: DateUtils.addHours({hours: 3})})
            event2 = await helper.createEvent({organizerId: baseOrganizer.id, id: 101, price: 70, date: DateUtils.addHours({hours: 4})})
            event3 = await helper.createEvent({organizerId: baseOrganizer.id, id: 102, price: 150, date: DateUtils.addHours({hours: 7})})
            event4 = await helper.createEvent({organizerId: baseOrganizer.id, id: 103, price: 200, date: DateUtils.addHours({hours: 5})})
        })

        afterAll(async () => {
            await helper.enabledEachResetDb()
        })

        const execute = async (query: GetEventsQueryDto = { }) => {
            return request(app.getHttpServer())
                .get(`/events`)
                .query({ sortBy:"id", sortOrder: "asc", ...query })
                .set("Authorization", `Bearer ${helper.token}`)
                .send()
        }

        it("should throw BadRequestException if first and before used together", async () => {
            const res = await execute({
                first: 1,
                before: "test"
            })
            expect(res.status).toBe(400)
        })

        it("should throw BadRequestException if last and after used together", async () => {
            const res = await execute({
                last: 1,
                after: "test"
            })
            expect(res.status).toBe(400)
        })

        it("should throw BadRequestException if last and first used together", async () => {
            const res = await execute({
                last: 1,
                first: 1
            })
            expect(res.status).toBe(400)
        })

        it("should return items if after and before used together", async () => {
            const afterRes = await execute({
                first: 1
            })
            const beforeRes = await execute({
                last: 1
            })
            const res = await execute({
                after: afterRes.body.pageInfo.endCursor,
                before: beforeRes.body.pageInfo.startCursor
            })
            expect(res.status).toBe(200)
            const items = res.body.data
            expect(items).toHaveLength(2)
            expect(items.map(event => event.id)).toEqual([event2.id, event3.id])
        })

        it("should return all events if no pagination value provided", async () => {
            const res = await execute()
            expect(res.status).toBe(200)
            const items = res.body.data
            expect(items).toHaveLength(4)
            expect(items.map(event => event.id)).toEqual([event1.id, event2.id, event3.id, event4.id])
            expect(res.body.pageInfo.hasNextPage).toBe(false)
            expect(res.body.pageInfo.hasPreviousPage).toBe(false)
        })

        it("should return events with sortOrder desc and before pagination", async () => {
            const res = await execute({
                last: 2,
                sortOrder: "desc"
            })
            expect(res.status).toBe(200)
            const items = res.body.data
            expect(items).toHaveLength(2)
            expect(items.map(event => event.id)).toEqual([event2.id, event1.id])
            expect(res.body.pageInfo.hasNextPage).toBe(false)
            expect(res.body.pageInfo.hasPreviousPage).toBe(true)
        })

        it("should return events when first fetch next page then fetch previous page", async () => {
            const res1 = await execute({
                first: 2
            })
            const beforeKey = res1.body.pageInfo.endCursor
            const res2 = await execute({
                last: 1,
                before: beforeKey
            })
            const items = res2.body.data
            expect(items).toHaveLength(1)
            expect(items.map(event => event.id)).toEqual([event1.id])
            expect(res2.body.pageInfo.hasNextPage).toBe(true)
            expect(res2.body.pageInfo.hasPreviousPage).toBe(false)
        })

        it("should return events with beforeKey", async () => {
            const res1 = await execute({
                last: 2,
                sortOrder: "asc"
            })
            const beforeKey = res1.body.pageInfo.startCursor
            const res2 = await execute({
                last: 2,
                before: beforeKey,
                sortOrder: "asc"
            })
            const items = res2.body.data
            expect(items).toHaveLength(2)
            expect(items.map(event => event.id)).toEqual([event1.id, event2.id])
            expect(res2.body.pageInfo.hasNextPage).toBe(true)
            expect(res2.body.pageInfo.hasPreviousPage).toBe(false)
           
        })

        it("should return last 2 events", async () => {
            const res = await execute({
                last: 2
            })
            expect(res.status).toBe(200)
            const items = res.body.data
            expect(items).toHaveLength(2)
            expect(items.map(event => event.id)).toEqual([event3.id, event4.id])
        })

        it("should return hasNextPage is false when there is no next page", async () => {
            const res1 = await execute({
                first: 2
            })
            const afterKey = res1.body.pageInfo.endCursor
            const res2 = await execute({
                first: 2,
                after: afterKey
            })
            expect(res2.body.pageInfo.hasPreviousPage).toBe(true)
            expect(res2.body.pageInfo.hasNextPage).toBe(false)
        })

        it("should return events with afterKey", async () => {
            const res1 = await execute({
                first: 1
            })
            const afterKey = res1.body.pageInfo.endCursor
            const res2 = await execute({
                first: 2,
                after: afterKey
            })
            const items = res2.body.data
            expect(items).toHaveLength(2)
            expect(items.map(event => event.id)).toEqual([event2.id, event3.id])
            expect(res2.body.pageInfo.hasNextPage).toBe(true)
            expect(res2.body.pageInfo.hasPreviousPage).toBe(true)
        })

        it("should return all events with sorted by date desc", async () => {
            const res = await execute({
                first: 2,
                sortBy: "date",
                sortOrder: "desc"
            })
            expect(res.status).toBe(200)
            const items = res.body.data
            expect(items).toHaveLength(2)
            expect(items.map(event => event.id)).toEqual([event3.id, event4.id])
        })

        it("should return events with sorted by id asc", async () => {
            const res = await execute({
                first: 2,
                sortBy: "id",
                sortOrder: "asc"
            })
            expect(res.status).toBe(200)
            const items = res.body.data
            expect(items).toHaveLength(2)
            expect(items.map(event => event.id)).toEqual([event1.id, event2.id])
        })

        it("should return events with sorted by price desc", async () => {
            const res = await execute({
                first: 2,
                sortBy: "price",
                sortOrder: "desc"
            })
            expect(res.status).toBe(200)
            const items = res.body.data
            expect(items).toHaveLength(2)
            expect(items.map(event => event.id)).toEqual([event4.id, event3.id])
        })

    })

})