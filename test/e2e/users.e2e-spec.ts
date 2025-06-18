import { PrismaService } from "@/prisma/prisma.service";
import { GetUserParticipantQueryDto } from "@/users/dto/get-user-participant-query.dto";
import { Event, EventParticipant, ParticipantStatus, User } from "@prisma/client";
import { E2eHelper } from "@test/utils/e2e-helper";
import * as request from 'supertest';



describe("Users", () => {

    let prisma: PrismaService;
    let helper: E2eHelper

    beforeAll(async () => {
        app = global.app;
        helper = new E2eHelper()
        prisma = app.get(PrismaService);
    })




    describe("getEventParticipants", () => {
        let baseEvent: Event
        let baseEvent2: Event
        let baseUser: User
        let baseOrganizer: User
        let participant1: EventParticipant
        let participant2: EventParticipant
        

        beforeEach(async () => {
            baseOrganizer = await helper.createOrganizator()
            baseEvent = await helper.createEvent({organizerId: baseOrganizer.id, id: 100})
            baseEvent2 = await helper.createEvent({organizerId: baseOrganizer.id, id: 101})


            baseUser = await helper.createUserAndToken({email: "demo@example.com", sub: 2})


            participant1 = await helper.createParticipant({eventId: baseEvent.id, userId: baseUser.id, status: ParticipantStatus.REGISTERED})
            participant2 = await helper.createParticipant({eventId: baseEvent2.id, userId: baseUser.id, status: ParticipantStatus.CANCELLED})
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
            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(1)
            expect(response.body[0].id).toEqual(participant2.id)
        })

        it("should return participants with given eventId", async () => {
            const response = await execute({ eventId: baseEvent2.id })
            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(1)
            expect(response.body[0].id).toEqual(participant2.id)
        })

        it("should return participants with user when include param contains event", async () => {
            const response = await execute({ include: "event" })
            expect(response.status).toBe(200)
            expect(response.body[0].event).not.toBeNull()
        })

        it("should return event participants", async () => {
            const response = await execute()
            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(2)
            expect(response.body[0].event).toBeUndefined()
        })

    })
})