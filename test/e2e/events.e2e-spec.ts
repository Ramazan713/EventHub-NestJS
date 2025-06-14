import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UpdateDraftEventDto } from "@/draft-events/dto/update-draft-event.dto";
import * as request from 'supertest';
import { EventCategory, Role } from "@prisma/client";
import { TokenPayload } from '@/auth/token-payload.interface';
import { CreateDraftEventDto } from '@/draft-events/dto/create-draft-event.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { DateUtils } from '@/common/date.utils';
import { TestUtils } from "@test/utils/test-utils";
import { createTestUser } from "@test/utils/test-helpers";

const baseTokenPayload = { sub: 1, email: "example@gmail.com", role: Role.ORGANIZER }

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
                currentParticipants: currentParticipants ?? 0
            },
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

});