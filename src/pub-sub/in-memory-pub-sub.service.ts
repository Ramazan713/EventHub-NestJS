import { PubSub } from "graphql-subscriptions";
import { PubSubService } from "./pub-sub.service";
import { Injectable } from "@nestjs/common";
import { PubSubAsyncIterableIterator } from "graphql-subscriptions/dist/pubsub-async-iterable-iterator";


@Injectable()
export class InMemoryPubSubService extends PubSubService {
    
    private readonly pubsub = new PubSub()

    async publishForGraphQL<T>(event: string, data: T): Promise<void> {
        this.pubsub.asyncIterableIterator
        return this.pubsub.publish(event, { [event]: data });
    }

    publish<T>(event: string, payload: T): Promise<void> {
        return this.pubsub.publish(event, payload);
    }


    asyncIterableIterator<T>(triggers: string | string[]): PubSubAsyncIterableIterator<T> {
        return this.pubsub.asyncIterableIterator(triggers);
    }
}