import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [
    PaymentsService,
    {
      provide: Stripe,
      useFactory(configService: ConfigService) {
        const isTest = process.env.NODE_ENV === 'test';
        return new Stripe(configService.getOrThrow("STRIPE_SECRET_KEY"),{
            ...(isTest && {
            host: configService.get<string>('STRIPE_HOST'),
            port: configService.get<number>('STRIPE_PORT'),
            protocol: "http",
          })
        });
      },
      inject: [ConfigService]
    }
  ],
  exports: [PaymentsService]
})
export class PaymentsModule {}
