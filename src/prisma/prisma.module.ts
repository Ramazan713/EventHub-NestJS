import { CommonModule } from "@/common/common.module";
import { EventRegistryService } from "@/common/events/event-registry.service";
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";


@Global()
@Module({
    imports: [
        CommonModule,
    ],
    providers: [
        {
            provide: PrismaService,
            inject: [EventRegistryService],
            useFactory(eventRegistryService: EventRegistryService) {
                return new PrismaService().withExtensions(eventRegistryService);
            },
        }
    ],
    exports: [PrismaService]
})
export class PrismaModule {

}