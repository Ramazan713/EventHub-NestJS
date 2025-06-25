import { Injectable } from "@nestjs/common";


@Injectable()
export abstract class PubSubService {

    abstract publishForGraphQL<T>(event: string, data: T): Promise<void>

    abstract publish<T>(event: string, payload: T): Promise<void>

    abstract asyncIterableIterator(triggers: string | string[]): any;
}