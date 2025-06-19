import { DateUtils } from '@/common/date.utils';
import { CreateDraftEventDto } from '@/draft-events/dto/create-draft-event.dto';
import { UpdateDraftEventDto } from "@/draft-events/dto/update-draft-event.dto";
import { PrismaService } from '@/prisma/prisma.service';
import { INestApplication } from "@nestjs/common";
import { DraftEvent, EventCategory, Role, User } from "@prisma/client";
import { E2eHelper } from "@test/utils/e2e-helper";
import { TestUtils } from "@test/utils/test-utils";
import * as request from 'supertest';


describe("DraftEvent", () => {
    let app: INestApplication
    let prisma: PrismaService;
    let helper: E2eHelper

    beforeAll(async () => {
        helper = new E2eHelper()
        app = global.app;
        prisma = app.get(PrismaService);
    })

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
            .auth(helper.token, { type: 'bearer' })
            .send(dto)
        }

        it("should throw if date is less than 1 hour in advance", async () => {
            await helper.createOrganizerAndToken()
            createDraftEventDto.date = new Date()
            const response = await execute(createDraftEventDto)
            expect(response.status).toBe(400)
        })

        it("should create draft-event", async () => {
            await helper.createOrganizerAndToken()
            const response = await execute(createDraftEventDto)
            expect(response.status).toBe(201)
            expect(response.body).toMatchObject({
                organizerId: helper.baseTokenPayload.sub,
                ...createDraftEventDto,
                date: createDraftEventDto.date.toISOString(),
            })
        })

        it("should throw ForbiddenException if user is not an organizer", async () => {
            await helper.createUserAndToken()
            const response = await execute(createDraftEventDto)
            expect(response.status).toBe(403)
        })
    })

    describe("getDrafts", () => {
        const execute = async () => {
            return request(app.getHttpServer())
            .get('/draft-events')
            .auth(helper.token, { type: 'bearer' })
            .send()
        }

        it("should return empty drafts if no drafts", async () => {
            await helper.createOrganizerAndToken()
            const response = await execute()
            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(0)
        })

        it("should return all organizer's drafts", async () => {
            await helper.createUser({sub: 1, role: Role.ORGANIZER})
            await helper.createOrganizerAndToken({sub: 2, email: "sample2@gmail" })

            await helper.createDraft({title: "title1", organizerId: 1})
            await helper.createDraft({title: "title3", organizerId: 2})
            await helper.createDraft({title: "title4", organizerId: 2})

            const response = await execute()

            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(2)
            expect(response.body).toEqual(expect.arrayContaining([
                expect.objectContaining({title: "title3"}),
                expect.objectContaining({title: "title4"})
            ]))
        })

        it("should throw ForbiddenException if user is not an organizer", async () => {
            await helper.createUserAndToken()
            const response = await execute()
            expect(response.status).toBe(403)
        })

        it("should return drafts by ordered date asc", async () => {
            await helper.createOrganizerAndToken()
            const currentDate = new Date()
            await helper.createDraft({date: DateUtils.addHours({hours: 3, currentDate})})
            await helper.createDraft({date: DateUtils.addHours({hours: 2, currentDate})})
            await helper.createDraft({date: DateUtils.addHours({hours: 4, currentDate})})
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
        let baseUser: User
        let baseDraft: DraftEvent

        beforeAll(async () => {
            helper.disabledEachResetDb()
            baseUser = await helper.createOrganizerAndToken()
            baseDraft = await helper.createDraft({organizerId: baseUser.id})
        })

        afterAll(async () => {
            await helper.enabledEachResetDb()
        })

        const execute = async (id: number = baseDraft.id) => {
            return request(app.getHttpServer())
            .get('/draft-events/' + id)
            .auth(helper.token, { type: 'bearer' })
            .send()
        }

        it("should throw NotFoundException if draft not found", async () => {
            const response = await execute(baseDraft.id + 1)
            expect(response.status).toBe(404)
        })

        it("should throw ForbiddenException if user is not an organizer", async () => {
            await helper.generateAndSetToken({role: Role.USER})
            const response = await execute()
            expect(response.status).toBe(403)
            await helper.generateAndSetToken({role: Role.ORGANIZER})
        })

        it("should return draft", async () => {
            const response = await execute()
            expect(response.status).toBe(200)
            expect(response.body).toMatchObject(TestUtils.omitDates(baseDraft))
        })

    })


    describe("updateDraft", () => {
        const execute = async (id: number, updateDraftDto: UpdateDraftEventDto) => {
            return request(app.getHttpServer())
            .patch('/draft-events/' + id)
            .auth(helper.token, { type: 'bearer' })
            .send(updateDraftDto)
        }

        it("should throw NotFoundException if draft not found", async () => {
            await helper.createOrganizerAndToken()
            const response = await execute(1, {})
            expect(response.status).toBe(404)
        })

        it("should throw ForbiddenException if user is not an organizer", async () => {
            await helper.createUserAndToken()
            const response = await execute(1, {})
            expect(response.status).toBe(403)
        })

        it("should update draft", async () => {
            await helper.createOrganizerAndToken()
            const draft = await helper.createDraft({title: "old title"})
            const response = await execute(draft.id, {title: "new title"})
            expect(response.status).toBe(200)
            expect(response.body).toMatchObject({title: "new title"})
        })
        it("should throw BadRequestException if date is less than 1 hour in advance", async () => {
            await helper.createOrganizerAndToken()
            const draft = await helper.createDraft()
            const response = await execute(draft.id, {date: new Date()})
            expect(response.status).toBe(400)
        })
    })

    describe("deleteDraft",() =>{
        const execute = async (id: number) => {
            return request(app.getHttpServer())
            .delete('/draft-events/' + id)
            .auth(helper.token, { type: 'bearer' })
            .send()
        }

        it("should throw NotFoundException if draft not found", async () => {
            await helper.createOrganizerAndToken()
            const response = await execute(1)
            expect(response.status).toBe(404)
        })

        it("should throw ForbiddenException if user is not an organizer", async () => {
            await helper.createUserAndToken()
            const response = await execute(1)
            expect(response.status).toBe(403)
        })

        it("should delete draft", async () => {
            await helper.createOrganizerAndToken()
            const draft = await helper.createDraft()
            const response = await execute(draft.id)
            expect(response.status).toBe(200)
        })
    })

    describe("publishDraft", () => {
        const execute = async (id: number) => {
            return request(app.getHttpServer())
            .post('/draft-events/' + id + '/publish')
            .auth(helper.token, { type: 'bearer' })
            .send()
        }

        it("should throw NotFoundException if draft not found", async () => {
            await helper.createOrganizerAndToken()
            const response = await execute(1)
            expect(response.status).toBe(404)
        })

        it("should throw ForbiddenException if user is not an organizer", async () => {
            await helper.createUserAndToken()
            const response = await execute(1)
            expect(response.status).toBe(403)
        })

        it("should publish draft", async () => {
            await helper.createOrganizerAndToken()
            const draft = await helper.createDraft()
            const response = await execute(draft.id)
            expect(response.status).toBe(200)
            const event = await prisma.event.findFirst({ where: { id: response.body.id } });            
            expect(event).toMatchObject(TestUtils.omitDates(response.body));
        })

        it("should delete draft when published", async () => {
            await helper.createOrganizerAndToken()
            const draft = await helper.createDraft()
            const response = await execute(draft.id)
            expect(response.status).toBe(200)
            const draftEvent = await prisma.draftEvent.findFirst({ where: { id: draft.id } });
            expect(draftEvent).toBeNull()
        })

        it("should throw BadRequestException if date is less than 1 hour in advance", async () => {
            await helper.createOrganizerAndToken()
            const draft = await helper.createDraft({date: new Date()})
            const response = await execute(draft.id)
            expect(response.status).toBe(400)
        })
    })
    
    describe("createDraftFromEvent", () => {
        const execute = async (id: number) => {
            return request(app.getHttpServer())
            .post('/draft-events/from-event/' + id)
            .auth(helper.token, { type: 'bearer' })
            .send()
        }

        it("should throw NotFoundException if event not found", async () => {
            await helper.createOrganizerAndToken()
            const response = await execute(1)
            expect(response.status).toBe(404)
        })

        it("should throw ForbiddenException if user is not an organizer", async () => {
            await helper.createUserAndToken()
            const response = await execute(1)
            expect(response.status).toBe(403)
        })

        it("should return created draft from event when draft exists", async () => {
            await helper.createOrganizerAndToken()
            const event = await helper.createEvent()
            const draft = await helper.createDraft({originalEventId: event.id})
            const response = await execute(event.id)
            const draftResponse = await prisma.draftEvent.findFirst({ where: { id: response.body.id } });
            expect(draft).toMatchObject(draftResponse!!)
            expect(response.status).toBe(200)
        })

        it("should create and return draft from event when draft does not exists", async () => {
            await helper.createOrganizerAndToken()
            const event = await helper.createEvent()
            const response = await execute(event.id)
            const draftResponse = await prisma.draftEvent.findFirst({ where: { id: response.body.id } });
            expect(response.body).toMatchObject(TestUtils.omitDates(draftResponse))
            expect(response.status).toBe(200)
        })

    })
   
});