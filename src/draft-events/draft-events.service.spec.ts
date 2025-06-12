import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { DraftEventsService } from './draft-events.service';

describe('DraftEventsService', () => {
  let service: DraftEventsService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
});
