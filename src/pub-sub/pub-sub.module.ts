import { Module } from '@nestjs/common';
import { PubSubService } from './pub-sub.service';
import { RedisPubSubService } from './redis-pub-sub.service';

@Module({
    providers: [
        {
            provide: PubSubService,
            useClass: RedisPubSubService
        }
    ],
    exports: [PubSubService]
})
export class PubSubModule {}
