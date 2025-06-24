import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';
import { PaginationModule } from '@/pagination/pagination.module';
import { PrismaService } from '@/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DraftEvent, EventCategory, Role } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import * as moment from 'moment';
import { DraftEventsService } from './draft-events.service';
import { CreateDraftEventDto } from './dto/create-draft-event.dto';
import { UpdateDraftEventDto } from './dto/update-draft-event.dto';


describe('DraftEventsService', () => {
  let service: DraftEventsService;
  let prisma: DeepMockProxy<PrismaService>;
  let activeUser: ActiveUserData

  beforeEach(async () => {
    activeUser = { sub: 1, email: "example@gmail.com", role: Role.ORGANIZER }
    prisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PaginationModule
      ],
      providers: [
        DraftEventsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DraftEventsService>(DraftEventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDraftEvent', () => {
    let createDraftEventDto: CreateDraftEventDto

    beforeEach(() => {
      const minFutureDate = moment(new Date()).add(3,"h").toDate() 
      createDraftEventDto = {
        title: "title",
        description: "description",
        category: EventCategory.MEETUP,
        isOnline: true,
        price: 0,
        date: minFutureDate,
      }
    })

    it("should throw if date is less than 1 hour in advance", async () => {
      createDraftEventDto.date = new Date()
      const responseAsync = service.createDraftEvent(activeUser, createDraftEventDto)
      await expect(responseAsync).rejects.toThrow(BadRequestException)      
    })

    it("should create draft event if date is valid", async () => {
      prisma.draftEvent.create.mockResolvedValue({id: 1, ...createDraftEventDto, } as any)
      const response = await service.createDraftEvent(activeUser, createDraftEventDto)
      expect(prisma.draftEvent.create).toHaveBeenCalledWith({
        data: {...createDraftEventDto, organizerId: activeUser.sub}
      })
      expect(response).toHaveProperty('id', 1);
    })
  })


  describe('getDraftById', () => {
    let draft: DraftEvent
    beforeEach(() => {
      draft = {
        id: 1,
        title: "title",
        description: "description",
        category: EventCategory.MEETUP,
        organizerId: activeUser.sub,
        isOnline: true,
        price: 0,
      } as any
    })

    it("should return draft if exists", async() => {
      prisma.draftEvent.findFirst.mockResolvedValue(draft)
      const response = await service.getDraftById(activeUser.sub, 1)
      expect(prisma.draftEvent.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          organizerId: activeUser.sub
        }
      })
      expect(response).toEqual(draft)
    })

    it("should throw NotFoundException if draft not found", async() => {
      prisma.draftEvent.findFirst.mockResolvedValue(null)
      const responseAsync = service.getDraftById(activeUser.sub, 1)
      await expect(responseAsync).rejects.toThrow(NotFoundException)
    })
  })

  describe("updateDraft", () => {
    let draft: DraftEvent
    let updateDraftEventDto: UpdateDraftEventDto
    beforeEach(() => {
      draft = {
        id: 1,
        title: "title",
        description: "description",
        category: EventCategory.MEETUP,
        organizerId: activeUser.sub,
        isOnline: true,
        price: 0,
      } as any
      updateDraftEventDto = {
        title: "title",
        description: "description",
        category: EventCategory.MEETUP,
        isOnline: true,
        price: 0,
        date: moment(new Date()).add(3,"h").toDate() 
      }
    })

    it("should update draft", async() => {
      prisma.draftEvent.findFirst.mockResolvedValue(draft)
      prisma.draftEvent.update.mockResolvedValue(draft)
      const response = await service.updateDraft(1, activeUser, updateDraftEventDto)
      expect(prisma.draftEvent.update).toHaveBeenCalledWith({
        where: {
          id: 1,
          organizerId: activeUser.sub
        },
        data: updateDraftEventDto
      })
      expect(response).toEqual(draft)
    })

    it("should throw NotFoundException if draft not found", async() => {
      prisma.draftEvent.findFirst.mockResolvedValue(null)
      const responseAsync = service.updateDraft(1, activeUser, updateDraftEventDto)
      await expect(responseAsync).rejects.toThrow(NotFoundException)
    })

    it("should throw BadRequestException if date is less than 1 hour in advance", async() => {
      prisma.draftEvent.findFirst.mockResolvedValue(draft)
      updateDraftEventDto.date = new Date()
      const responseAsync = service.updateDraft(1, activeUser, updateDraftEventDto)
      await expect(responseAsync).rejects.toThrow(BadRequestException)
    })
  })

  describe("deleteDraft", () => {
    let draft: DraftEvent
    beforeEach(() => {
      draft = {
        id: 1,
        title: "title",
        description: "description",
        category: EventCategory.MEETUP,
        organizerId: activeUser.sub,
        isOnline: true,
        price: 0,
      } as any
    })

    it("should delete draft", async() => {
      prisma.draftEvent.findFirst.mockResolvedValue(draft)
      prisma.draftEvent.delete.mockResolvedValue(draft)
      await service.deleteDraft(1, activeUser.sub)
      expect(prisma.draftEvent.delete).toHaveBeenCalledWith({
        where: {
          id: 1,
          organizerId: activeUser.sub
        }
      })
    })

    it("should throw NotFoundException if draft not found", async() => {
      prisma.draftEvent.findFirst.mockResolvedValue(null)
      const responseAsync = service.deleteDraft(1, activeUser.sub)
      await expect(responseAsync).rejects.toThrow(NotFoundException)
    })
  })

  describe("publishDraft", () => {
    let draft: DraftEvent
    let event
    beforeEach(() => {
      draft = {
        id: 1,
        title: "title",
        description: "description",
        category: EventCategory.MEETUP,
        organizerId: activeUser.sub,
        isOnline: true,
        price: 0,
        originalEventId: 1
      } as any

      event = {
        id: 1,
        title: "title",
        description: "description",
        category: EventCategory.MEETUP,
        organizerId: activeUser.sub,
        isOnline: true,
        price: 0,
      } as any
    })

    it("should publish draft", async() => {
      prisma.draftEvent.findFirst.mockResolvedValue(draft)
      prisma.$transaction.mockImplementation(async (fn: any) => fn(prisma))
      prisma.event.upsert.mockResolvedValue(event)
      prisma.draftEvent.delete.mockResolvedValue(draft)
      const response = await service.publishDraft(1, activeUser.sub)
      expect(prisma.draftEvent.delete).toHaveBeenCalledWith({
        where: {
          id: 1,
        }
      })
      expect(response).toEqual(event)
    })

    it("should throw NotFoundException if draft not found", async() => {
      prisma.draftEvent.findFirst.mockResolvedValue(null)
      const responseAsync = service.publishDraft(1, activeUser.sub)
      await expect(responseAsync).rejects.toThrow(NotFoundException)
    })

    it("should throw BadRequestException if draftDate is less than 1 hour in advance", async() => {
      prisma.draftEvent.findFirst.mockResolvedValue(draft)
      draft.date = new Date()
      const responseAsync = service.publishDraft(1, activeUser.sub)
      await expect(responseAsync).rejects.toThrow(BadRequestException)
    })

    describe("createDraftFromEvent", () => {
      let event: any;
      let draft: any;
      let newDraft: any;

      beforeEach(() => {
        event = {
          id: 2,
          title: "event title",
          description: "event description",
          category: EventCategory.MEETUP,
          date: moment(new Date()).add(3, "h").toDate(),
          price: 10,
          capacity: 100,
          isOnline: true,
          location: "Online",
          organizerId: activeUser.sub,
          isCancelled: false
        };
        draft = {
          id: 3,
          title: "draft title",
          description: "draft description",
          category: EventCategory.MEETUP,
          date: moment(new Date()).add(3, "h").toDate(),
          price: 10,
          capacity: 100,
          isOnline: true,
          location: "Online",
          organizerId: activeUser.sub,
          originalEventId: event.id
        };
        newDraft = {
          ...draft,
          id: 4
        };
      });

      it("should throw NotFoundException if event not found", async () => {
        prisma.event.findFirst.mockResolvedValue(null);
        const responseAsync = service.createDraftFromEvent(activeUser, event.id);
        await expect(responseAsync).rejects.toThrow(NotFoundException);
      });

      it("should return existing draft if found", async () => {
        prisma.event.findFirst.mockResolvedValue(event);
        prisma.draftEvent.findFirst.mockResolvedValue(draft);
        // Mock DraftEventDto.fromDraftEvent to return the draft itself for simplicity
        const spy = jest.spyOn(require('./dto/draft-event.dto').DraftEventDto, 'fromDraftEvent').mockReturnValue(draft);
        const response = await service.createDraftFromEvent(activeUser, event.id);
        expect(prisma.event.findFirst).toHaveBeenCalledWith({
          where: {
            id: event.id,
            organizerId: activeUser.sub,
            isCancelled: false
          }
        });
        expect(prisma.draftEvent.findFirst).toHaveBeenCalledWith({
          where: {
            originalEventId: event.id,
            organizerId: activeUser.sub
          }
        });
        expect(response).toEqual(draft);
        spy.mockRestore();
      });

      it("should create and return new draft if not found", async () => {
        prisma.event.findFirst.mockResolvedValue(event);
        prisma.draftEvent.findFirst.mockResolvedValue(null);
        prisma.draftEvent.create.mockResolvedValue(newDraft);
        // Mock DraftEventDto.fromDraftEvent to return the newDraft itself for simplicity
        const spy = jest.spyOn(require('./dto/draft-event.dto').DraftEventDto, 'fromDraftEvent').mockReturnValue(newDraft);
        const response = await service.createDraftFromEvent(activeUser, event.id);
        expect(prisma.draftEvent.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            title: event.title,
            description: event.description,
            category: event.category,
            date: event.date,
            price: event.price,
            capacity: event.capacity,
            isOnline: event.isOnline,
            location: event.location,
            organizerId: event.organizerId,
            originalEventId: event.id
          })
        });
        expect(response).toEqual(newDraft);
        spy.mockRestore();
      });
    });
  })

});
