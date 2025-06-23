import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from './events/events.module';
import { DraftEventsModule } from './draft-events/draft-events.module';
import { EventParticipantsModule } from './event-participants/event-participants.module';
import { TicketsModule } from './tickets/tickets.module';
import { PaymentsModule } from './payments/payments.module';
import { CommonModule } from './common/common.module';
import { OrganizersModule } from './organizers/organizers.module';
import * as Joi from 'joi';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().required()
      })
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: ['./**/*.graphql'],
      graphiql: true
    }),
    AuthModule, 
    UsersModule,
    PrismaModule,
    EventsModule,
    DraftEventsModule,
    EventParticipantsModule,
    TicketsModule,
    PaymentsModule,
    CommonModule,
    OrganizersModule,
  ],
})
export class AppModule {}
