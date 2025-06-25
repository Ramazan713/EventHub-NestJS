import { Prisma } from '@prisma/client';


export abstract class AbstractPrismaEventSubscriber<Model> {

    abstract readonly model: Prisma.ModelName;

    abstract onCreate(record: Model): void | Promise<void>;
    
    abstract onUpdate(record: Model): void | Promise<void>;

    abstract onDelete(record: Model): void | Promise<void>;
}

