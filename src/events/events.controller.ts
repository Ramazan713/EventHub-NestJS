import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { EventsService } from './events.service';
import { EventDto } from './dto/event.dto';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { TokenPayload } from 'src/auth/token-payload.interface';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'generated/prisma';
import { RolesGuard } from 'src/auth/roles.guard';

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {

    constructor(private eventsService: EventsService){}

    @HttpCode(201)
    @Roles(Role.ORGANIZER, Role.ADMIN)
    @UseGuards(RolesGuard)
    @Post()
    async createEvent(
        @CurrentUser() user: TokenPayload,
        @Body() createEventDto: CreateEventDto
    ): Promise<EventDto>{
        return await this.eventsService.createEvent(user.sub, createEventDto)
    }

}
