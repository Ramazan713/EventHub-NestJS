import { TokenPayload } from "@/auth/token-payload.interface";
import { DateUtils } from "@/common/date.utils";
import { PrismaService } from "@/prisma/prisma.service";
import { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { DraftEvent, Event, EventCategory, EventParticipant, ParticipantStatus, Prisma, Role, Ticket, TicketStatus, User } from "@prisma/client";
import Stripe from "stripe";
import { resetTestDatabase } from "./prisma-reset";


export class E2eHelper {
    protected app: INestApplication;
    protected jwtService: JwtService;
    protected stripe: Stripe
    prisma: PrismaService;
    token: string;
    readonly baseTokenPayload = { sub: 1, email: "example@gmail.com", role: Role.ORGANIZER }
    

    constructor() {
        this.app = global.app;
        this.jwtService = this.app.get(JwtService);
        this.prisma = this.app.get(PrismaService);
        this.stripe = this.app.get(Stripe)
    }

    async createUser(
        tokenPayload: Partial<TokenPayload & {passwordHash?: string}> = {}
    ): Promise<User> {
        const {sub, email, role} = this.getTokenPayloadOrDefault(tokenPayload)
        return await this.prisma.user.create({ data: { id: sub, email, passwordHash: tokenPayload.passwordHash ?? "password", role} });
    }

    async createOrganizator(tokenPayload: Partial<TokenPayload & {passwordHash?: string}> = {}): Promise<User> {
        return this.createUser({role: Role.ORGANIZER, email: "organizer@gmail.com", sub: 1000 ,...tokenPayload})
    }

    async createUserAndToken(payload: Partial<TokenPayload> = {}): Promise<User> {
        const newPayload = this.getTokenPayloadOrDefault({ role: Role.USER, ...payload })
        const user = await this.createUser(newPayload);
        this.token = await this.jwtService.signAsync(newPayload);
        return user
    }

    async createOrganizerAndToken(payload: Partial<TokenPayload> = {}): Promise<User> {
        return this.createUserAndToken({role: Role.ORGANIZER, ...payload})
    }

    async generateAndSetToken(payload: Partial<TokenPayload>): Promise<string> {
        this.token = await this.jwtService.signAsync(this.getTokenPayloadOrDefault(payload))
        return this.token
    }

    disabledEachResetDb(){
        global.testContext.skipReset = true
    }  

    async enabledEachResetDb(){
        global.testContext.skipReset = false
        await resetTestDatabase(this.prisma)
    }

    async createDraft(data: Partial<Prisma.DraftEventUncheckedCreateInput> = {}): Promise<DraftEvent> {
        return await prisma.draftEvent.create({
            data: {
                title: data?.title || "title",
                description: data?.description || "description",
                category: data?.category || EventCategory.MEETUP,
                isOnline: data.isOnline || true,
                price: data?.price || 0,
                date: data.date ?? DateUtils.addHours({hours: 3}),
                originalEventId: data?.originalEventId,
                organizerId: data?.organizerId || this.baseTokenPayload.sub,
                capacity: data?.capacity,
                id: data?.id,
            }
        })
    }

    async createEvent(data: Partial<Prisma.EventUncheckedCreateInput> = {}): Promise<Event> {
        return await prisma.event.create({
            data: {
                id: data?.id,
                category: data?.category || EventCategory.OTHER,
                description: data?.description || "test",
                isCancelled: data?.isCancelled ?? false,
                isOnline: data?.isOnline || false,
                location: data?.location || "test",
                organizerId: data?.organizerId || this.baseTokenPayload.sub,
                capacity: data?.capacity,
                date: data?.date || DateUtils.addHours({hours: 3}),
                title: data?.title || "test",
                price: data?.price ?? 0,
                currentParticipants: data?.currentParticipants ?? 0,
                
            },
        })
    }

    async createTicket(data: Partial<Prisma.TicketUncheckedCreateInput> & {eventId: number} = {eventId: 1}): Promise<Ticket> {
        return await prisma.ticket.create({
            data: {
                eventId: data.eventId,
                userId: data?.userId ?? this.baseTokenPayload.sub,
                status: data?.status ?? TicketStatus.BOOKED,
                priceAtPurchase: 100,
                paymentIntentId: data?.paymentIntentId ?? "pi_123"
            }
        })
    }

    async createParticipant(data: Partial<Prisma.EventParticipantUncheckedCreateInput> = {}): Promise<EventParticipant> {
        return await prisma.eventParticipant.create({
            data: {
                eventId: data?.eventId ?? 1,
                userId: data?.userId ?? this.baseTokenPayload.sub,
                status: data?.status ?? ParticipantStatus.REGISTERED,
                id: data?.id
            }
        })
    }

    getSignature(payload: string){
        return this.stripe.webhooks.generateTestHeaderString({
            payload,
            secret: process.env.STRIPE_WEBHOOK_SECRET!,
        })
    }

    private getTokenPayloadOrDefault(payload: Partial<TokenPayload>): TokenPayload {
         const {
            sub      = this.baseTokenPayload.sub,
            email    = this.baseTokenPayload.email,
            role     = this.baseTokenPayload.role,
        } = payload;
        return {sub, email, role}
    }

}