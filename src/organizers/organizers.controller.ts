import { ActiveUser } from '@/auth/decorators/current-user.decorator';
import { ActiveUserData } from '@/auth/interfaces/active-user-data.interface';
import { EventsService } from '@/events/events.service';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { OrganizerEventsQueryDto } from './dto/organizer-events-query.dto';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RestPaginationFormatter } from '@/pagination/formetters/rest-pagination.formatter';

@Roles(Role.ORGANIZER, Role.ADMIN)
@Controller('organizers')
export class OrganizersController {

    constructor(
        private readonly eventsService: EventsService,
        private readonly restFormatter: RestPaginationFormatter
    ){}

    
    @Get('events')
    async getOrganizerEvents(
        @ActiveUser() user: ActiveUserData,
        @Query() query: OrganizerEventsQueryDto
    ){
        const response = await this.eventsService.getEventsByOwner(user.sub, query)
        return this.restFormatter.format(response);
    }

    @Get("events/:id")
    async getEventById(
        @ActiveUser() user: ActiveUserData,
        @Param('id') id: number
    ){
        return this.eventsService.getEventByOwnerId(user.sub, id);
    }
}
