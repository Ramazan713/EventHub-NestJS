import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as moment from 'moment';
import * as request from 'supertest';
import { EventCategory, Role } from "../../generated/prisma";
import { TokenPayload } from "../../src/auth/token-payload.interface";
import { CreateDraftEventDto } from "../../src/draft-events/dto/create-draft-event.dto";
import { PrismaService } from "../../src/prisma/prisma.service";
import { createTestUser } from "../../test/utils/test-helpers";



describe("DraftEvent", () => {
    let app: INestApplication
    let tokenPayload: TokenPayload
    let jwtService: JwtService
    let prisma: PrismaService;
    let token: string

    beforeAll(async () => {
        app = global.app;
        jwtService = app.get<JwtService>(JwtService)
        prisma = app.get(PrismaService);

        tokenPayload = { sub: 1, email: "example@gmail.com", role: Role.ORGANIZER }
    })

    const createUserAndToken = async (payload: TokenPayload = tokenPayload) => {
        tokenPayload = payload
        await createTestUser(prisma, payload)
        token = await jwtService.signAsync(payload)
    }

    describe("createDraftEvent", () => {
        let createDraftEventDto: CreateDraftEventDto
        

        beforeEach(async() => {
            const minFutureDate = moment(new Date()).add(3,"h").toDate() 
            createDraftEventDto = {
                title: "title",
                description: "description",
                category: EventCategory.MEETUP,
                isOnline: true,
                price: 0,
                date: minFutureDate,
            }
            token = await jwtService.signAsync(tokenPayload)
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
                organizerId: tokenPayload.sub,
                ...createDraftEventDto,
                date: createDraftEventDto.date.toISOString(),
            })
        })

        it("should throw ForbiddenException if user is not an organizer", async () => {
            await createUserAndToken({...tokenPayload, role: Role.USER})
            const response = await execute(createDraftEventDto)
            expect(response.status).toBe(403)
        })

    })

    
   
});