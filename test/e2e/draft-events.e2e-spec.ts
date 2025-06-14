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

describe("DraftEvent", () => {
    let app: INestApplication
    let jwtService: JwtService
    let prisma: PrismaService;
    let token: string

    beforeAll(async () => {
        app = global.app;
        jwtService = app.get(JwtService)
        prisma = app.get(PrismaService);
    })

    const createUserAndToken = async (payload: TokenPayload = baseTokenPayload) => {
        await createTestUser(prisma, payload)
        token = await jwtService.signAsync(payload)
    }

    const createDraft = async(
            draft: {title?: string, description?: string, date?: Date, eventId?: number} = {},
            payload: TokenPayload = baseTokenPayload
    ) => {
        return await prisma.draftEvent.create({
            data: {
                title: draft?.title || "title",
                description: draft?.description || "description",
                category: EventCategory.MEETUP,
                isOnline: true,
                price: 0,
                date: draft.date ?? DateUtils.addHours({hours: 3}),
                originalEventId: draft?.eventId,
                organizerId: payload.sub
            }
        })
    }

    describe("createDraftEvent", () => {
        let createDraftEventDto: CreateDraftEventDto
        beforeEach(async() => {
            createDraftEventDto = {
                title: "title",
                description: "description",
                category: EventCategory.MEETUP,
                isOnline: true,
                price: 0,
                date: DateUtils.addHours({hours: 3}),
            }
        })


        const execute = async (dto: CreateDraftEventDto = createDraftEventDto) => {
            return request(app.getHttpServer())
            .post('/draft-events')
            .auth(token, { type: 'bearer' })
            .send(dto)
        }

        it("should throw if date is less than 1 hour in advance", async () => {
            await createUserAndToken()
            createDraftEventDto.date = new Date()
            const response = await execute(createDraftEventDto)
            expect(response.status).toBe(400)
        })

        it("should create draft-event", async () => {
            await createUserAndToken()
            const response = await execute(createDraftEventDto)
            expect(response.status).toBe(201)
            expect(response.body).toMatchObject({
                organizerId: baseTokenPayload.sub,
                ...createDraftEventDto,
                date: createDraftEventDto.date.toISOString(),
            })
        })

        it("should throw ForbiddenException if user is not an organizer", async () => {
            await createUserAndToken({...baseTokenPayload, role: Role.USER})
            const response = await execute(createDraftEventDto)
            expect(response.status).toBe(403)
        })
    })

    describe("getDrafts", () => {
        const execute = async () => {
            return request(app.getHttpServer())
            .get('/draft-events')
            .auth(token, { type: 'bearer' })
            .send()
        }

        it("should return empty drafts if no drafts", async () => {
            await createUserAndToken()
            const response = await execute()
            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(0)
        })

        it("should return all organizer's drafts", async () => {
            await createUserAndToken({...baseTokenPayload, sub: 1, })
            await createUserAndToken({...baseTokenPayload, sub: 2, email: "sample2@gmail" })

            await createDraft({title: "title1"}, {...baseTokenPayload, sub: 1})
            await createDraft({title: "title3"}, {...baseTokenPayload, sub: 2})
            await createDraft({title: "title4"}, {...baseTokenPayload, sub: 2})

            const response = await execute()

            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(2)
            expect(response.body).toEqual(expect.arrayContaining([
                expect.objectContaining({title: "title3"}),
                expect.objectContaining({title: "title4"})
            ]))
        })

        it("should throw ForbiddenException if user is not an organizer", async () => {
            await createUserAndToken({...baseTokenPayload, role: Role.USER})
            const response = await execute()
            expect(response.status).toBe(403)
        })

        it("should return drafts by ordered date asc", async () => {
            await createUserAndToken()
            const currentDate = new Date()
            await createDraft({date: DateUtils.addHours({hours: 3, currentDate})}, baseTokenPayload)
            await createDraft({date: DateUtils.addHours({hours: 2, currentDate})}, baseTokenPayload)
            await createDraft({date: DateUtils.addHours({hours: 4, currentDate})}, baseTokenPayload)
            const response = await execute()
            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(3)
            expect(response.body).toEqual(expect.arrayContaining([
                expect.objectContaining({date: DateUtils.addHours({hours: 2, currentDate}).toISOString()}),
                expect.objectContaining({date: DateUtils.addHours({hours: 3, currentDate}).toISOString()}),
                expect.objectContaining({date: DateUtils.addHours({hours: 4, currentDate}).toISOString()}),
            ]))
        })
    })

    describe("getDraftById", () => {
        const execute = async (id: number) => {
            return request(app.getHttpServer())
            .get('/draft-events/' + id)
            .auth(token, { type: 'bearer' })
            .send()
        }

        it("should throw NotFoundException if draft not found", async () => {
            await createUserAndToken()
            const response = await execute(1)
            expect(response.status).toBe(404)
        })

        it("should throw ForbiddenException if user is not an organizer", async () => {
            await createUserAndToken({...baseTokenPayload, role: Role.USER})
            const response = await execute(1)
            expect(response.status).toBe(403)
        })

        it("should return draft", async () => {
            await createUserAndToken()
            const draft = await createDraft({}, baseTokenPayload)
            const response = await execute(draft.id)
            expect(response.status).toBe(200)
            expect(response.body).toMatchObject(TestUtils.omitDates(draft))
        })

    })


    describe("updateDraft", () => {
        const execute = async (id: number, updateDraftDto: UpdateDraftEventDto) => {
            return request(app.getHttpServer())
            .patch('/draft-events/' + id)
            .auth(token, { type: 'bearer' })
            .send(updateDraftDto)
        }

        it("should throw NotFoundException if draft not found", async () => {
            await createUserAndToken()
            const response = await execute(1, {})
            expect(response.status).toBe(404)
        })

        it("should throw ForbiddenException if user is not an organizer", async () => {
            await createUserAndToken({...baseTokenPayload, role: Role.USER})
            const response = await execute(1, {})
            expect(response.status).toBe(403)
        })

        it("should update draft", async () => {
            await createUserAndToken()
            const draft = await createDraft({title: "old title"}, baseTokenPayload)
            const response = await execute(draft.id, {title: "new title"})
            expect(response.status).toBe(200)
            expect(response.body).toMatchObject({title: "new title"})
        })
        it("should throw BadRequestException if date is less than 1 hour in advance", async () => {
            await createUserAndToken()
            const draft = await createDraft({}, baseTokenPayload)
            const response = await execute(draft.id, {date: new Date()})
            expect(response.status).toBe(400)
        })
    })

    describe("deleteDraft",() =>{
        const execute = async (id: number) => {
            return request(app.getHttpServer())
            .delete('/draft-events/' + id)
            .auth(token, { type: 'bearer' })
            .send()
        }

        it("should throw NotFoundException if draft not found", async () => {
            await createUserAndToken()
            const response = await execute(1)
            expect(response.status).toBe(404)
        })

        it("should throw ForbiddenException if user is not an organizer", async () => {
            await createUserAndToken({...baseTokenPayload, role: Role.USER})
            const response = await execute(1)
            expect(response.status).toBe(403)
        })

        it("should delete draft", async () => {
            await createUserAndToken()
            const draft = await createDraft({}, baseTokenPayload)
            const response = await execute(draft.id)
            expect(response.status).toBe(200)
        })
    })

    describe("publishDraft", () => {
        const execute = async (id: number) => {
            return request(app.getHttpServer())
            .post('/draft-events/' + id + '/publish')
            .auth(token, { type: 'bearer' })
            .send()
        }

        it("should throw NotFoundException if draft not found", async () => {
            await createUserAndToken()
            const response = await execute(1)
            expect(response.status).toBe(404)
        })

        it("should throw ForbiddenException if user is not an organizer", async () => {
            await createUserAndToken({...baseTokenPayload, role: Role.USER})
            const response = await execute(1)
            expect(response.status).toBe(403)
        })

        it("should publish draft", async () => {
            await createUserAndToken()
            const draft = await createDraft({}, baseTokenPayload)
            const response = await execute(draft.id)
            expect(response.status).toBe(200)
            const event = await prisma.event.findFirst({ where: { id: response.body.id } });            
            expect(event).toMatchObject(TestUtils.omitDates(response.body));
        })

        it("should delete draft when published", async () => {
            await createUserAndToken()
            const draft = await createDraft({}, baseTokenPayload)
            const response = await execute(draft.id)
            expect(response.status).toBe(200)
            const draftEvent = await prisma.draftEvent.findFirst({ where: { id: draft.id } });
            expect(draftEvent).toBeNull()
        })

        it("should throw BadRequestException if date is less than 1 hour in advance", async () => {
            await createUserAndToken()
            const draft = await createDraft({date: new Date()}, baseTokenPayload)
            const response = await execute(draft.id)
            expect(response.status).toBe(400)
        })
    })
    
    describe("createDraftFromEvent", () => {
        const execute = async (id: number) => {
            return request(app.getHttpServer())
            .post('/draft-events/from-event/' + id)
            .auth(token, { type: 'bearer' })
            .send()
        }

        const createEvent = async() => {
            return prisma.event.create({
                data: {
                    category: EventCategory.MEETUP,
                    description: "test",
                    isCancelled: false,
                    isOnline: false,
                    location: "test",
                    organizerId: baseTokenPayload.sub,
                    capacity: 10,
                    date: new Date(),
                    title: "test",
                    price: 10
                },
            })        
    
        }

        it("should throw NotFoundException if event not found", async () => {
            await createUserAndToken()
            const response = await execute(1)
            expect(response.status).toBe(404)
        })

        it("should throw ForbiddenException if user is not an organizer", async () => {
            await createUserAndToken({...baseTokenPayload, role: Role.USER})
            const response = await execute(1)
            expect(response.status).toBe(403)
        })

        it("should return created draft from event when draft exists", async () => {
            await createUserAndToken()
            const event = await createEvent()
            const draft = await createDraft({eventId: event.id}, baseTokenPayload)
            const response = await execute(event.id)
            const draftResponse = await prisma.draftEvent.findFirst({ where: { id: response.body.id } });
            expect(draft).toMatchObject(draftResponse!!)
            expect(response.status).toBe(200)
        })

        it("should create and return draft from event when draft does not exists", async () => {
            await createUserAndToken()
            const event = await createEvent()
            const response = await execute(event.id)
            const draftResponse = await prisma.draftEvent.findFirst({ where: { id: response.body.id } });
            expect(response.body).toMatchObject(TestUtils.omitDates(draftResponse))
            expect(response.status).toBe(200)
        })

    })
   
});