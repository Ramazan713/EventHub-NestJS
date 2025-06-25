import { EventRegistryService } from "@/common/events/event-registry.service";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { discoveryBasedPubSubExtension } from "./prisma-event.extension";


@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {

    async onModuleInit() {
        await this.$connect()
    }

    withExtensions(eventRegistry: EventRegistryService) {
        return this
        .$extends(discoveryBasedPubSubExtension(eventRegistry));
    }


}