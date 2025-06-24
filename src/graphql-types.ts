
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export enum EventSortBy {
    DATE = "DATE",
    PRICE = "PRICE",
    ID = "ID"
}

export enum SortOrder {
    ASC = "ASC",
    DESC = "DESC"
}

export enum EventCategory {
    WORKSHOP = "WORKSHOP",
    SEMINAR = "SEMINAR",
    CONCERT = "CONCERT",
    MEETUP = "MEETUP",
    WEBINAR = "WEBINAR",
    OTHER = "OTHER"
}

export enum ParticipantStatus {
    REGISTERED = "REGISTERED",
    CANCELLED = "CANCELLED"
}

export enum TicketStatus {
    RESERVED = "RESERVED",
    BOOKED = "BOOKED",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED",
    REFUND_FAILED = "REFUND_FAILED",
    REFUND_REQUESTED = "REFUND_REQUESTED"
}

export enum Role {
    USER = "USER",
    ORGANIZER = "ORGANIZER",
    ADMIN = "ADMIN"
}

export class LoginInput {
    email: string;
    password: string;
}

export class SignUpInput {
    email: string;
    password: string;
}

export class BaseEventsQueryInput {
    q?: Nullable<string>;
    category?: Nullable<EventCategory>;
    isOnline?: Nullable<boolean>;
    location?: Nullable<string>;
    dateFrom?: Nullable<Date>;
    dateTo?: Nullable<Date>;
    priceFrom?: Nullable<number>;
    priceTo?: Nullable<number>;
    sortBy?: Nullable<EventSortBy>;
    sortOrder?: Nullable<SortOrder>;
}

export class PaginationInput {
    first?: Nullable<number>;
    last?: Nullable<number>;
    after?: Nullable<string>;
    before?: Nullable<string>;
}

export class DraftEventQueryInput {
    first?: Nullable<number>;
    last?: Nullable<number>;
    after?: Nullable<string>;
    before?: Nullable<string>;
}

export class CreateDraftEventInput {
    title: string;
    description: string;
    category: EventCategory;
    date: Date;
    price: number;
    capacity?: Nullable<number>;
    isOnline: boolean;
    location?: Nullable<string>;
}

export class UpdateDraftEventInput {
    title?: Nullable<string>;
    description?: Nullable<string>;
    category?: Nullable<EventCategory>;
    date?: Nullable<Date>;
    price?: Nullable<number>;
    capacity?: Nullable<number>;
    isOnline?: Nullable<boolean>;
    location?: Nullable<string>;
}

export class PublicEventsQueryInput {
    q?: Nullable<string>;
    category?: Nullable<EventCategory>;
    isOnline?: Nullable<boolean>;
    location?: Nullable<string>;
    dateFrom?: Nullable<Date>;
    dateTo?: Nullable<Date>;
    priceFrom?: Nullable<number>;
    priceTo?: Nullable<number>;
    sortBy?: Nullable<EventSortBy>;
    sortOrder?: Nullable<SortOrder>;
    first?: Nullable<number>;
    last?: Nullable<number>;
    after?: Nullable<string>;
    before?: Nullable<string>;
    organizerId?: Nullable<number>;
}

export class EventTicketsQueryInput {
    first?: Nullable<number>;
    last?: Nullable<number>;
    after?: Nullable<string>;
    before?: Nullable<string>;
    status?: Nullable<TicketStatus>;
    userId?: Nullable<number>;
}

export class OrganizerEventsQueryInput {
    q?: Nullable<string>;
    category?: Nullable<EventCategory>;
    isOnline?: Nullable<boolean>;
    location?: Nullable<string>;
    dateFrom?: Nullable<Date>;
    dateTo?: Nullable<Date>;
    priceFrom?: Nullable<number>;
    priceTo?: Nullable<number>;
    sortBy?: Nullable<EventSortBy>;
    sortOrder?: Nullable<SortOrder>;
    first?: Nullable<number>;
    last?: Nullable<number>;
    after?: Nullable<string>;
    before?: Nullable<string>;
    isCancelled?: Nullable<boolean>;
}

export class UserTicketQueryInput {
    first?: Nullable<number>;
    last?: Nullable<number>;
    after?: Nullable<string>;
    before?: Nullable<string>;
    status?: Nullable<TicketStatus>;
    dateFrom?: Nullable<Date>;
    dateTo?: Nullable<Date>;
}

export class UserEventsQueryInput {
    q?: Nullable<string>;
    category?: Nullable<EventCategory>;
    isOnline?: Nullable<boolean>;
    location?: Nullable<string>;
    dateFrom?: Nullable<Date>;
    dateTo?: Nullable<Date>;
    priceFrom?: Nullable<number>;
    priceTo?: Nullable<number>;
    sortBy?: Nullable<EventSortBy>;
    sortOrder?: Nullable<SortOrder>;
    first?: Nullable<number>;
    last?: Nullable<number>;
    after?: Nullable<string>;
    before?: Nullable<string>;
    organizerId?: Nullable<number>;
    isCancelled?: Nullable<boolean>;
    status?: Nullable<ParticipantStatus>;
}

export interface IEvent {
    id: number;
    title: string;
    price: number;
    description: string;
    category: EventCategory;
    date: string;
    updatedAt: string;
    isOnline: boolean;
    location?: Nullable<string>;
}

export interface IUser {
    id: number;
    email: string;
    name?: Nullable<string>;
}

export abstract class IMutation {
    login?: AuthPayload;
    signUp?: AuthPayload;
    createDraft?: DraftEvent;
    updateDraft?: DraftEvent;
    deleteDraft?: DraftEvent;
    publishDraft?: DraftEvent;
    createDraftFromEvent?: DraftEvent;
    cancelEvent?: Event;
    registerEvent?: boolean;
    unregisterEvent?: boolean;
    purchaseTicket?: CreateTicketPayload;
    cancelTicket?: boolean;
}

export class AuthPayload {
    token: string;
    user: UserDetailInfo;
}

export class PageInfo {
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    startCursor?: Nullable<string>;
    endCursor?: Nullable<string>;
}

export class DraftEvent {
    id: number;
    title: string;
    description: string;
    category: EventCategory;
    isOnline: boolean;
    price: number;
    capacity?: Nullable<number>;
    location?: Nullable<string>;
    date: string;
    updatedAt: string;
    createdAt: string;
    originalEventId?: Nullable<number>;
    organizerId: number;
    event?: Nullable<Event>;
}

export abstract class IQuery {
    draftEvents?: DraftConnection;
    draftEventById?: DraftEvent;
    participants?: ParticipantConnection;
    publicEvents?: EventInfoConnection;
    publicEventById?: EventInfo;
    eventTickets?: TicketConnection;
    organizer: Organizer;
    createdEvents?: EventConnection;
    organizerEventById?: Event;
    tickets?: TicketConnection;
    ticketById?: Ticket;
    user: User;
    registeredEvents?: EventInfoConnection;
    userEventById?: EventInfo;
}

export class DraftEdge {
    node: DraftEvent;
    cursor: string;
}

export class DraftConnection {
    edges: DraftEdge[];
    pageInfo: PageInfo;
}

export class EventParticipant {
    id: number;
    userId: number;
    eventId: number;
    status: ParticipantStatus;
    registeredAt: string;
    user: UserInfo;
    event: EventInfo;
}

export class ParticipantEdge {
    cursor: string;
    node: EventParticipant;
}

export class ParticipantConnection {
    edges: ParticipantEdge[];
    pageInfo: PageInfo;
}

export class EventInfo implements IEvent {
    id: number;
    title: string;
    price: number;
    description: string;
    category: EventCategory;
    date: string;
    updatedAt: string;
    isOnline: boolean;
    location?: Nullable<string>;
    organizerId: number;
    organizer: UserInfo;
}

export class Event implements IEvent {
    id: number;
    title: string;
    price: number;
    description: string;
    category: EventCategory;
    date: string;
    updatedAt: string;
    isOnline: boolean;
    location?: Nullable<string>;
    createdAt: string;
    isCancelled: boolean;
    capacity?: Nullable<number>;
    currentParticipants: number;
    organizerId: number;
    participants?: ParticipantConnection;
    organizer: Organizer;
    draft?: Nullable<DraftEvent>;
    tickets?: TicketConnection;
}

export class EventInfoEdge {
    cursor: string;
    node: EventInfo;
}

export class EventInfoConnection {
    edges: EventInfoEdge[];
    pageInfo: PageInfo;
}

export class EventEdge {
    cursor: string;
    node: Event;
}

export class EventConnection {
    edges: EventEdge[];
    pageInfo: PageInfo;
}

export class Organizer implements IUser {
    id: number;
    email: string;
    name?: Nullable<string>;
    role: Role;
    createdEvents?: EventConnection;
    registeredEvents?: EventInfoConnection;
    draftEvents?: DraftConnection;
}

export class Ticket {
    id: number;
    userId: number;
    eventId: number;
    status: TicketStatus;
    priceAtPurchase: number;
    paymentIntentId?: Nullable<string>;
    failedReason?: Nullable<string>;
    createdAt: string;
    updatedAt: string;
    paidAt?: Nullable<string>;
    refundedAt?: Nullable<string>;
    event: EventInfo;
}

export class TicketEdge {
    cursor: string;
    node: Ticket;
}

export class TicketConnection {
    edges: TicketEdge[];
    pageInfo: PageInfo;
}

export class CreateTicketPayload {
    checkoutUrl?: Nullable<string>;
    paymentSessionId?: Nullable<string>;
}

export class UserInfo implements IUser {
    id: number;
    email: string;
    name?: Nullable<string>;
}

export class UserDetailInfo implements IUser {
    id: number;
    email: string;
    name?: Nullable<string>;
    role: Role;
}

export class User implements IUser {
    id: number;
    email: string;
    name?: Nullable<string>;
    role: Role;
    registeredEvents?: EventInfoConnection;
    tickets?: TicketConnection;
}

type Nullable<T> = T | null;
