import { Injectable } from '@nestjs/common';
import { DraftEvent } from '@prisma/client';
import { DraftEventDto } from './dto/draft-event.dto';
import { AbstractPrismaEventSubscriber } from '@/common/events/prisma-event.subscriber';
import { PrismaEventSubscriber } from '@/common/events/prisma-event.decorator';
import { mapToDto } from '@/common/mappers/map-to-dto.mapper';
import { PubSubService } from '@/pub-sub/pub-sub.service';
import { DraftEvents } from './enums/draft-events.enum';

@Injectable()
@PrismaEventSubscriber()
export class DraftEventSubscriber implements AbstractPrismaEventSubscriber<DraftEvent> {
    
    readonly model = 'DraftEvent';

    constructor(
        private readonly pubSubService: PubSubService
    ){}

    onCreate(record: DraftEvent) {
        this.pubSubService.publishForGraphQL(DraftEvents.CREATED, mapToDto(DraftEventDto, record))
    }

    onUpdate(record: DraftEvent) {
        this.pubSubService.publishForGraphQL(DraftEvents.UPDATED, mapToDto(DraftEventDto, record))
    }

    onDelete(record: DraftEvent) {
        this.pubSubService.publishForGraphQL(DraftEvents.DELETED, mapToDto(DraftEventDto, record))
    }
}