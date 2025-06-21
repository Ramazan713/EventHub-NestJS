import { ActiveUser } from '@/auth/decorators/current-user.decorator';
import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';
import { EventsService } from '@/events/events.service';
import { Controller, Get, Query } from '@nestjs/common';
import { OrganizerEventsQueryDto } from './dto/organizer-events-query.dto';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Roles(Role.ORGANIZER, Role.ADMIN)
@Controller('organizers')
export class OrganizersController {

    constructor(
        private readonly eventsService: EventsService
    ){}

    
    @Get('events')
    async getOrganizerEvents(
        @ActiveUser() user: ActiveUserData,
        @Query() query: OrganizerEventsQueryDto
    ){
        return this.eventsService.getEventsByOwner(user.sub, query)
    }
}
