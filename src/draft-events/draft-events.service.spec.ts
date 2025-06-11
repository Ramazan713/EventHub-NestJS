import { Test, TestingModule } from '@nestjs/testing';
import { DraftEventsService } from './draft-events.service';

describe('DraftEventsService', () => {
  let service: DraftEventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DraftEventsService],
    }).compile();

    service = module.get<DraftEventsService>(DraftEventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
