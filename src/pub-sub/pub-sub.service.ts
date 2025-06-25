import { Injectable } from "@nestjs/common";


@Injectable()
export abstract class PubSubService {

    abstract publish<T>(event: string, data: T): Promise<void>

    abstract asyncIterableIterator(triggers: string | string[]): any;
}