import { TokenPayload } from '@/auth/token-payload.interface';
import { DateUtils } from '@/common/date.utils';
import { PrismaService } from '@/prisma/prisma.service';
import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { EventCategory, ParticipantStatus, Role } from "@prisma/client";
import { createTestUser } from "@test/utils/test-helpers";
import { TestUtils } from "@test/utils/test-utils";
import * as request from 'supertest';

const baseTokenPayload = { sub: 2, email: "example2@gmail.com", role: Role.ORGANIZER }

describe("Events", () => {
    let app: INestApplication
    let jwtService: JwtService
    let prisma: PrismaService;
    let token: string
    let baseOrganizerId: number

    beforeAll(async () => {
        app = global.app;
        jwtService = app.get(JwtService)
        prisma = app.get(PrismaService);
    })

    beforeEach(async () => {
        const organizer = await createTestUser(prisma, {sub: 1000, email: "organizer@gmail.com", role: Role.ORGANIZER})
        baseOrganizerId = organizer.id
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
                organizerId: organizerId ?? baseOrganizerId,
                capacity,
                date: DateUtils.addHours({hours: 3}),
                title: "test",
                price: price ?? 0,
                currentParticipants: currentParticipants ?? 0,
            },
        })        
    }

    const registerUser = async (eventId: number, userId: number = baseTokenPayload.sub) => {
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
            baseEventId = await createEvent({eventId: 100}).then(event => event.id)
        })
        const execute = async (eventId: number = baseEventId) => {
            return request(app.getHttpServer())
                .post(`/events/${eventId}/register`)
                .set("Authorization", `Bearer ${token}`)
                .send()
        }

        it("should register user to event", async () => {
            await createUserAndToken()
            const response = await execute()
            expect(response.status).toBe(200)
            const event = await prisma.event.findFirst({ where: { id: response.body.id } });
            expect(event).toMatchObject(TestUtils.omitDates(response.body));
            expect(event?.currentParticipants).toBe(1)
        })

        it("should register user to event when user unregister before", async () => {
            await createUserAndToken()
            await prisma.event.update({
                where: {
                    id: baseEventId
                },
                data: {
                    participants: {
                        create: {
                            status: ParticipantStatus.CANCELLED,
                            userId: baseTokenPayload.sub
                        }
                    }
                }
            })
            const response = await execute()
            expect(response.status).toBe(200)
        })

        it("should throw NotFoundException if event not found", async () => {
            await createUserAndToken()
            const response = await execute(baseEventId + 1)
            expect(response.status).toBe(404)
        })

        it("should throw BadRequestException if user already registered", async () => {
            await createUserAndToken()
            await execute()
            const response = await execute()
            expect(response.status).toBe(400)
        })

        it("should throw NotFoundException if event is cancelled", async () => {
            await createUserAndToken()
            await createEvent({eventId: baseEventId + 1, isCancelled: true})
            const response = await execute(baseEventId + 1)
            expect(response.status).toBe(404)
        })

        it("should throw BadRequestException if event is full", async () => {
            await createUserAndToken()
            await createEvent({eventId: baseEventId + 1, capacity: 1, currentParticipants: 1})
            const response = await execute(baseEventId + 1)
            expect(response.status).toBe(400)
        })

        it("should throw NotFoundException if price is not free", async () => {
            await createUserAndToken()
            await createEvent({eventId: baseEventId + 1, price: 1})
            const response = await execute(baseEventId + 1)
            expect(response.status).toBe(404)
        })
    })

    describe("event unregister",() => {
        let baseEventId: number

        beforeEach(async () => {
            baseEventId = await createEvent({eventId: 100, capacity: 10}).then(event => event.id)
        })

        const execute = async (eventId: number = baseEventId) => {
            return request(app.getHttpServer())
                .post(`/events/${eventId}/unregister`)
                .set("Authorization", `Bearer ${token}`)
                .send()
        }

        it("should unregister user from event", async () => {
            await createUserAndToken()
            await registerUser(baseEventId)
            const response = await execute()
            expect(response.status).toBe(200)
            const event = await prisma.event.findFirst({ where: { id: response.body.id }, include: { participants: true } });
            expect(event?.currentParticipants).toBe(0)
            expect(event?.participants[0].status).toBe(ParticipantStatus.CANCELLED)
        })

        it("should throw NotFoundException if event not found", async () => {
            await createUserAndToken()
            const response = await execute(baseEventId + 1)
            expect(response.status).toBe(404)
        })

        it("should throw BadRequestException if user is not registered", async () => {
            await createUserAndToken()
            const response = await execute()
            expect(response.status).toBe(400)
        })

        it("should throw NotFoundException if event is cancelled", async () => {
            await createUserAndToken()
            await createEvent({eventId: baseEventId + 1, isCancelled: true})
            const response = await execute(baseEventId + 1)
            expect(response.status).toBe(404)
        })

        it("should throw NotFoundException if price is not free", async () => {
            await createUserAndToken()
            await createEvent({eventId: baseEventId + 1, price: 1})
            const response = await execute(baseEventId + 1)
            expect(response.status).toBe(404)
        })
    })


    describe("getParticipants",() => {
        let eventId: number

        const createEventAndRegisterRandomUser = async ({isCancelled, price}: {isCancelled?: boolean, price?: number} = {}) => {
            eventId = await createEvent({eventId: 100, organizerId: baseTokenPayload.sub, isCancelled, price}).then(event => event.id)
            const user = await createTestUser(prisma, {role: Role.USER, sub: 10000, email: "demo@example.com"})
            await registerUser(eventId, user.id)
        }

        const execute = async (id: number = eventId) => {
            return request(app.getHttpServer())
                .get(`/events/${id}/participants`)
                .set("Authorization", `Bearer ${token}`)
                .send()
        }

        it("should return participants", async () => {
            await createUserAndToken()
            await createEventAndRegisterRandomUser()
            const response = await execute()
            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(1)
        })

        it("should throw NotFoundException if event not found", async () => {
            await createUserAndToken()
            const response = await execute(eventId + 1)
            expect(response.status).toBe(404)
        })

        it("should throw ForbiddenException if user is not an organizer", async () => {
            await createUserAndToken({...baseTokenPayload, role: Role.USER})
            await createEventAndRegisterRandomUser()
            const response = await execute(eventId)
            expect(response.status).toBe(403)
        })

        it("should throw NotFoundException if event is cancelled", async () => {
            await createUserAndToken()
            await createEventAndRegisterRandomUser({isCancelled: true})
            const response = await execute(eventId)
            expect(response.status).toBe(404)
        })
    })

});