import { PrismaService } from '@/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EventCategory, ParticipantStatus } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { EventParticipantsService } from './event-participants.service';

describe('EventParticipantsService', () => {
  let service: EventParticipantsService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeAll(async () => {
    prisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventParticipantsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(EventParticipantsService);
  });

  describe("register", () => {
    const eventId = 1;
    const userId = 2;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should throw NotFoundException if event is not found", async () => {
      prisma.event.findFirst.mockResolvedValue(null);

      await expect(service.register(eventId, userId)).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if user is already registered", async () => {
      prisma.event.findFirst.mockResolvedValue({
        id: eventId,
        isCancelled: false,
        price: 0,
        participants: [{ userId, status: ParticipantStatus.REGISTERED }],
        capacity: 10,
        currentParticipants: 5,
      } as any);

      await expect(service.register(eventId, userId)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if event is full", async () => {
      prisma.event.findFirst.mockResolvedValue({
        id: eventId,
        isCancelled: false,
        price: 0,
        participants: [],
        capacity: 5,
        currentParticipants: 5,
      } as any);

      await expect(service.register(eventId, userId)).rejects.toThrow(BadRequestException);
    });

    it("should register user if all conditions are met", async () => {
      prisma.event.findFirst.mockResolvedValue({
        id: eventId,
        isCancelled: false,
        price: 0,
        participants: [],
        capacity: 10,
        currentParticipants: 5,
      } as any);

      prisma.$transaction.mockImplementation(async (cb) => {
        // Simulate transaction callback
        const txn = {
          eventParticipant: {
            create: jest.fn().mockResolvedValue({}),
          },
          event: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return await cb(txn);
      });

      await expect(service.register(eventId, userId)).resolves.toBeUndefined();

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      // Optionally, check that create and update were called with correct args
    });

    it("should allow registration if event has no capacity limit", async () => {
      prisma.event.findFirst.mockResolvedValue({
        id: eventId,
        isCancelled: false,
        price: 0,
        participants: [],
        capacity: null,
        currentParticipants: 0,
        category: EventCategory.MEETUP,
      } as any);

      prisma.$transaction.mockImplementation(async(cb) => {
        const txn = {
          eventParticipant: {
            create: jest.fn().mockResolvedValue({}),
          },
          event: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return await cb(txn);
      });

      await expect(service.register(eventId, userId)).resolves.toBeUndefined();
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});


