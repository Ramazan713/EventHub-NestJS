import { PrismaService } from '@/prisma/prisma.service';
import { ParticipantStatus, Role } from "@prisma/client";
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

});