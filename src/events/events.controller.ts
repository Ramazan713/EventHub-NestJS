import { Controller, Get, HttpCode, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { Role } from '../../generated/prisma';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TokenPayload } from '../auth/token-payload.interface';
import { EventDto } from './dto/event.dto';
import { EventsService } from './events.service';

@UseGuards(RolesGuard)
@UseGuards(JwtAuthGuard)
@Roles(Role.ORGANIZER, Role.ADMIN)
@Controller('events')
export class EventsController {

    constructor(private eventsService: EventsService){}

    @Get()
    async getEvents(
        @CurrentUser() user: TokenPayload
    ): Promise<EventDto[]> {
        return this.eventsService.getEvents(user.sub);
    }

    @HttpCode(200)
    @Post(":id/cancel")
    async cancelEvent(
        @CurrentUser() user: TokenPayload,
        @Param("id", ParseIntPipe) eventId: number
    ): Promise<EventDto> {
        return this.eventsService.cancelEvent(user.sub, eventId);
    }
    
}
