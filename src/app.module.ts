import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { PaginationService } from './pagination/services/pagination.service';
import { PaginationModule } from './pagination/pagination.module';
import { PubSubModule } from './pub-sub/pub-sub.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { GraphqlConfigService } from './common/config/graphql-config.service';

@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().required()
      })
    }),
    AuthModule, 
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [JwtModule],
      inject: [JwtService, ConfigService],
      useClass: GraphqlConfigService
    }),
    UsersModule,
    PrismaModule,
    EventsModule,
    DraftEventsModule,
    EventParticipantsModule,
    TicketsModule,
    PaymentsModule,
    CommonModule,
    OrganizersModule,
    PaginationModule,
    PubSubModule,
  ],
  providers: [PaginationService],
})
export class AppModule {}
