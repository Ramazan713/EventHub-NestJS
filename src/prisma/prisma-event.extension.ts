// src/prisma/prisma-event.extension.ts
import { Prisma } from '@prisma/client';
import { EventRegistryService } from '@/common/events/event-registry.service';

type CanonicalEvent = 'create' | 'update' | 'delete';

function getCanonicalEvent(operation: string, result: any, args: any): CanonicalEvent | null {
    switch (operation) {
        case 'create':
        case 'createMany':
            return 'create';

        case 'update':
        case 'updateMany':
            return 'update';

        case 'delete':
        case 'deleteMany':
            return 'delete';
        
        case 'upsert':
            // UPSERT MANTIĞI: Prisma, upsert'in create mi yoksa update mi yaptığını doğrudan söylemez.
            // Yaygın bir yöntem: `createdAt` ve `updatedAt` zaman damgalarını karşılaştırmak.
            // Eğer birbirlerine çok yakınlarsa (örn. 1 saniyeden az fark varsa), bu bir 'create' işlemidir.
            if (result.createdAt && result.updatedAt && 
                Math.abs(result.updatedAt.getTime() - result.createdAt.getTime()) < 1000) {
                return 'create';
            }
            return 'update';

        default:
            return null;
    }
}

export function discoveryBasedPubSubExtension(
    registry: EventRegistryService,
) {
    return Prisma.defineExtension({
        name: 'discovery-based-pubsub-extension',
        query: {
            $allModels: {
                $allOperations: async ({ model, operation, args, query }) => {
                    const result = await query(args);

                    const subscribers = registry.getSubscribersForModel(model as Prisma.ModelName);
                    if (subscribers.length === 0 || !result) {
                        return result;
                    }

                    const canonicalEvent = getCanonicalEvent(operation, result, args);
                    if (!canonicalEvent) return result;

                    const items = Array.isArray(result) ? result : [result];

                    for (const item of items) {
                        for (const subscriber of subscribers) {
                            switch (canonicalEvent) {
                                case 'create': subscriber.onCreate(item); break;
                                case 'update': subscriber.onUpdate(item); break;
                                case 'delete': subscriber.onDelete(item); break;
                            }

                        }
                    }
                    return result;
                },
            },
        },
    });
}