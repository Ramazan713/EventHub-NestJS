import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '@/prisma/prisma.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PaymentsService } from '@/payments/payments.service';
import { TicketStatus } from '@prisma/client';

describe('EventsService', () => {
  let service: EventsService;
  let prisma: DeepMockProxy<PrismaService>;
  let paymentService: DeepMockProxy<PaymentsService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    paymentService = mockDeep<PaymentsService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PaymentsService, useValue: paymentService },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  describe("cancelEvent", () => {

    it("should refund payment when event is canceled", async () => {
      const organizerId = 1;
      const eventId = 1;
      prisma.$transaction.mockImplementation(async (cb) => {
        const fakeTxn = {
          event: {
            findFirst: jest.fn().mockResolvedValue({
              id: eventId,
              organizerId,
              isCancelled: false,
              tickets: [
                { userId: 1, status: TicketStatus.BOOKED, paymentIntentId: "pi_1" },
                { userId: 2, status: TicketStatus.BOOKED, paymentIntentId: "pi_2" },
              ],
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          ticket: {
            update: jest.fn().mockResolvedValue({}),
          },
          draftEvent: {
            deleteMany: jest.fn().mockResolvedValue({}),
          }
        };
        return cb(fakeTxn as any);
      });
      const refundSpy = jest.spyOn(paymentService, 'refundPayment').mockResolvedValue(undefined);

      await service.cancelEvent(organizerId, eventId);
      expect(refundSpy).toHaveBeenCalledTimes(2);
      expect(refundSpy).toHaveBeenCalledWith("pi_1");
      expect(refundSpy).toHaveBeenCalledWith("pi_2");
    })
  })

});
