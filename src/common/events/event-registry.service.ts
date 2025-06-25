// src/core/events/event-registry.service.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { PRISMA_EVENT_SUBSCRIBER_KEY } from './prisma-event.decorator';
import { AbstractPrismaEventSubscriber } from './prisma-event.subscriber';

@Injectable()
export class EventRegistryService implements OnModuleInit {

    private readonly registry = new Map<Prisma.ModelName, AbstractPrismaEventSubscriber<any>[]>();

    constructor(
        private readonly discoveryService: DiscoveryService,
        private readonly reflector: Reflector,
    ) {}

    onModuleInit() {
        const providers = this.discoveryService.getProviders();
        
        for (const wrapper of providers) {
            const { instance } = wrapper;
            if (!instance || typeof instance !== 'object') {
                continue;
            }

            const isSubscriber = this.reflector.get(PRISMA_EVENT_SUBSCRIBER_KEY, instance.constructor);

            if (isSubscriber) {
                const subscriber = instance as AbstractPrismaEventSubscriber<any>;
                const modelName = subscriber.model;

                if (!this.registry.has(modelName)) {
                    this.registry.set(modelName, []);
                }
                this.registry.get(modelName)!!.push(subscriber);
            }
        }
    }

    getSubscribersForModel(modelName: Prisma.ModelName): AbstractPrismaEventSubscriber<any>[] {
        return this.registry.get(modelName) || [];
    }
}