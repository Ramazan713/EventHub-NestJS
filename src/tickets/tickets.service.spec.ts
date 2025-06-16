import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaService } from '@/prisma/prisma.service';
import { PaymentsService } from '@/payments/payments.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TicketStatus } from '@prisma/client';
import { WebhookRequest } from '@/payments/models/webhook-request.model';
import { PaymentEvenType } from '@/payments/enums/payment-even-type.enum';

describe('TicketsService', () => {
  let service: TicketsService;
  let prisma: DeepMockProxy<PrismaService>;
  let paymentService: DeepMockProxy<PaymentsService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    paymentService = mockDeep<PaymentsService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService, 
        { provide: PrismaService, useValue: prisma },
        { provide: PaymentsService, useValue: paymentService },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  describe("createTicket", () => {
    const eventId = 1;
    const userId = 2;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should throw NotFoundException if event is not found", async () => {
      prisma.event.findFirst.mockResolvedValue(null);

      await expect(service.createTicket(eventId, userId)).rejects.toThrow(NotFoundException);
    })

    it("should throw BadRequestException if user already has registered", async () => {
      prisma.event.findFirst.mockResolvedValue({
        id: eventId,
        isCancelled: false,
        price: 10,
        tickets: [{ userId, status: TicketStatus.RESERVED }],
        capacity: 10,
        currentParticipants: 5,
      } as any);

      await expect(service.createTicket(eventId, userId)).rejects.toThrow(BadRequestException);
    })

    it("should throw BadRequestException if user already has a ticket", async () => {
      prisma.event.findFirst.mockResolvedValue({
        id: eventId,
        isCancelled: false,
        price: 10,
        tickets: [{ userId, status: TicketStatus.BOOKED }],
        capacity: 10,
        currentParticipants: 5,
      } as any);

      await expect(service.createTicket(eventId, userId)).rejects.toThrow(BadRequestException);
    })

    it("should throw BadRequestException if event is free", async () => {
      prisma.event.findFirst.mockResolvedValue({
        id: eventId,
        isCancelled: false,
        price: 0,
        tickets: [],
        capacity: 10,
        currentParticipants: 5,
      } as any);

      await expect(service.createTicket(eventId, userId)).rejects.toThrow(BadRequestException);
    })

    it("should throw BadRequestException if capacity is full", async () => {
      prisma.event.findFirst.mockResolvedValue({
        id: eventId,
        isCancelled: false,
        price: 10,
        tickets: [],
        capacity: 1,
        currentParticipants: 1,
      } as any);

      await expect(service.createTicket(eventId, userId)).rejects.toThrow(BadRequestException);
    })

    it("should throw BadRequestException if capacity is full with reserved tickets", async () => { 
      prisma.event.findFirst.mockResolvedValue({
        id: eventId,
        isCancelled: false,
        price: 10,
        tickets: [{ userId, status: TicketStatus.RESERVED }],
        capacity: 1,
        currentParticipants: 0,
      } as any);

      await expect(service.createTicket(eventId, userId)).rejects.toThrow(BadRequestException);
    })

    it("should create ticket and update event", async () => {
      prisma.event.findFirst.mockResolvedValue({
        id: eventId,
        isCancelled: false,
        price: 10,
        tickets: [],
        capacity: 10,
        currentParticipants: 5,
      } as any);

      prisma.$transaction.mockResolvedValue({checkoutUrl: "checkout session"} as any);
      const checkoutSession = await service.createTicket(eventId, userId)
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(checkoutSession).toEqual({
          checkoutUrl: "checkout session"
      })
    })

    it("should create ticket even if user cancel ticket before", async () => {
      prisma.event.findFirst.mockResolvedValue({
        id: eventId,
        isCancelled: false,
        price: 10,
        tickets: [{ userId, status: TicketStatus.CANCELLED }],
        capacity: 10,
        currentParticipants: 5,
      } as any);

      prisma.$transaction.mockResolvedValue({checkoutUrl: "checkout session"} as any);
      const checkoutSession = await service.createTicket(eventId, userId)
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(checkoutSession).toEqual({
          checkoutUrl: "checkout session"
      })
    })
  })

  describe("cancelTicket", () => {
    const ticketId = 1;
    const userId = 2;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should throw NotFoundException if ticket is not found", async () => {
      prisma.ticket.findFirst.mockResolvedValue(null);

      await expect(service.cancelTicket(ticketId, userId)).rejects.toThrow(NotFoundException);
    })

    it("should throw BadRequestException if paymentIntentId is null", async () => {
      prisma.ticket.findFirst.mockResolvedValue({
        id: ticketId,
        userId,
        status: TicketStatus.RESERVED,
        paymentIntentId: null
      } as any);

      await expect(service.cancelTicket(ticketId, userId)).rejects.toThrow(BadRequestException);    
    })

    it("should throw BadRequestException if refundPayment throws error", async () => {
      prisma.ticket.findFirst.mockResolvedValue({
        id: ticketId,
        userId,
        status: TicketStatus.BOOKED,
        paymentIntentId: "payment intent id"
      } as any);

      paymentService.refundPayment.mockRejectedValue(new Error())
      await expect(service.cancelTicket(ticketId, userId)).rejects.toThrow(BadRequestException);
    })

    it("should cancel ticket", async () => {
      prisma.ticket.findFirst.mockResolvedValue({
        id: ticketId,
        userId,
        status: TicketStatus.BOOKED,
        paymentIntentId: "payment intent id"
      } as any);

      await service.cancelTicket(ticketId, userId)
      expect(paymentService.refundPayment).toHaveBeenCalledTimes(1);
    })

  })



  describe("handlePayment", () => {
    let webhookRequest: WebhookRequest
    
    beforeEach(() => {
      jest.clearAllMocks();
      webhookRequest = {body: Buffer.from(""), headers: {}} as WebhookRequest
    });

    it("should return when paymentResult is null", async () => {
      paymentService.parseWebhookRequest.mockResolvedValue(null)
      await service.handlePayment(webhookRequest)
      expect(prisma.$transaction).not.toHaveBeenCalled();
    })
    it("should update event and ticket for charge type", async () => {
      paymentService.parseWebhookRequest.mockResolvedValue({eventId: 1, ticketId: 1, status: TicketStatus.BOOKED, eventType: PaymentEvenType.CHARGE, paymentIntentId: "a"})
      await service.handlePayment(webhookRequest)
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    })
    it("should update event and ticket for refund type", async () => {
      paymentService.parseWebhookRequest.mockResolvedValue({eventId: 1, ticketId: 1, status: TicketStatus.BOOKED, eventType: PaymentEvenType.REFUND, paymentIntentId: "a"})
      await service.handlePayment(webhookRequest)
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    })
    it("should throw BadRequestException if error occurs", async () => {
      paymentService.parseWebhookRequest.mockRejectedValue(new Error())
      await expect(service.handlePayment(webhookRequest)).rejects.toThrow(BadRequestException)
    })



  })


});
