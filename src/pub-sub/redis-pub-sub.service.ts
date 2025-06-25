import { ConfigService } from '@nestjs/config';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { PubSubService } from './pub-sub.service';
import { PubSubAsyncIterableIterator } from 'graphql-subscriptions/dist/pubsub-async-iterable-iterator';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisPubSubService extends PubSubService {

    private readonly pubsub: RedisPubSub

    constructor(
        private readonly configService: ConfigService
    ) {
        super()
        this.pubsub = new RedisPubSub({
            connection: {
                host: configService.get<string>('REDIS_HOST'),
                port: configService.get<number>('REDIS_PORT'),
            }
        });
    }

    publish<T>(event: string, data: T): Promise<void> {
        return this.pubsub.publish(event, { [event]: data });
    }

    asyncIterableIterator<T>(triggers: string | string[]): PubSubAsyncIterableIterator<T> {
        return this.pubsub.asyncIterableIterator(triggers);
    }

}