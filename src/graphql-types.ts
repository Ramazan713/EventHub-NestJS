
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

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
    draftEvents: DraftEvent[];
    participants?: EventParticipant[];
    publicEvents: EventInfo[];
    organizer: Organizer;
    createdEvents: Event[];
    tickets: Ticket[];
    user: User;
    registeredEvents: EventInfo[];
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
    participants: EventParticipant[];
    organizer: Organizer;
    draft?: Nullable<DraftEvent>;
    tickets: Ticket[];
}

export class Organizer implements IUser {
    id: number;
    email: string;
    name?: Nullable<string>;
    role: Role;
    createdEvents: Event[];
    registeredEvents: EventInfo[];
    draftEvents: DraftEvent[];
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
    registeredEvents: EventInfo[];
    tickets: Ticket[];
}

type Nullable<T> = T | null;
