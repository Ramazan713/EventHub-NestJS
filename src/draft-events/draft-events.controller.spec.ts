import { Test, TestingModule } from '@nestjs/testing';
import { DraftEventsController } from './draft-events.controller';

describe('DraftEventsController', () => {
  let controller: DraftEventsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DraftEventsController],
    }).compile();

    controller = module.get<DraftEventsController>(DraftEventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
