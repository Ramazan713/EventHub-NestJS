import { SetMetadata } from '@nestjs/common';

export const PRISMA_EVENT_SUBSCRIBER_KEY = 'PRISMA_EVENT_SUBSCRIBER_KEY';

export const PrismaEventSubscriber = () => SetMetadata(PRISMA_EVENT_SUBSCRIBER_KEY, true);