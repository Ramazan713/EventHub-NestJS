import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from './events/events.module';
import { DraftEventsModule } from './draft-events/draft-events.module';
import { EventParticipantsModule } from './event-participants/event-participants.module';
import * as Joi from 'joi';

@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().required()
      })
    }),
    AuthModule, 
    UsersModule,
    PrismaModule,
    EventsModule,
    DraftEventsModule,
    EventParticipantsModule,
  ],
})
export class AppModule {}
