import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { EventRegistryService } from './events/event-registry.service';


@Module({
    imports: [
        DiscoveryModule
    ],
    providers: [
        EventRegistryService
    ],
    exports: [
        EventRegistryService
    ]
})
export class CommonModule {}
