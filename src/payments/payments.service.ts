import { Injectable } from '@nestjs/common';
import { CheckoutSession } from './models/checkout.model';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { Event, TicketStatus } from '@prisma/client';
import { WebhookRequest } from './models/webhook-request.model';
import { PaymentResult } from './models/payment-result.model';

@Injectable()
export class PaymentsService {


    constructor(
        private configService: ConfigService,
        private stripe: Stripe
    ){
      
    }


    async createCheckoutSession(event: Event, ticketId: number): Promise<CheckoutSession> {
        const metadata = {
            "ticketId": ticketId,
            "eventId": event.id
        }
        const session = await this.stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                         product_data: {
                            name: event.title, description: event.description
                        },
                        unit_amount: event.price * 100
                    },
                    quantity: 1
                }
            ],
            success_url: "http://localhost:3000/",
            cancel_url: "http://localhost:3000/",
            metadata,
            mode: "payment",
            payment_intent_data: {
                 metadata,
            }
        })

        return {
            checkoutUrl: session.url,
            paymentSessionId: session.id
        }
    }


    async parseWebhookRequest(webhookRequest: WebhookRequest): Promise<PaymentResult | null> {
        try {
            const event = this.stripe.webhooks.constructEvent(
                webhookRequest.body!!, 
                webhookRequest.headers["stripe-signature"], 
                this.configService.getOrThrow("STRIPE_WEBHOOK_SECRET")
            );
            
            switch(event.type){
                case "payment_intent.succeeded":
                    console.log(event)
                    let eventId = this.getEventIdFromStripe(event.data.object.metadata);
                    console.log(`PaymentIntent for was successful! eventId: ${eventId}`);
                    return {
                        eventId: eventId,
                        ticketId: this.getTicketIdFromStripe(event.data.object.metadata),
                        status: TicketStatus.BOOKED,
                        paymentIntentId: event.data.object.id,
                        err: null
                    }
                case "payment_intent.payment_failed":
                    console.log(JSON.stringify(event, null, 2));
                    console.log(`PaymentIntent for payment_failed`);
                    return {
                        eventId: this.getEventIdFromStripe(event.data.object.metadata),
                        ticketId: this.getTicketIdFromStripe(event.data.object.metadata),
                        status: TicketStatus.CANCELLED,
                        paymentIntentId: event.data.object.id,
                        err: event.data.object.last_payment_error?.message
                    }
                default:
                    console.log(`Unhandled event type ${event.type}`);
                    return null
            }
        }catch (err) {
            console.log(`⚠️  Webhook signature verification failed.`, err.message);
            throw err
        }
    }

    private getEventIdFromStripe(metadata: Stripe.Metadata): number {
        return Number(metadata.eventId);
    }

    private getTicketIdFromStripe(metadata: Stripe.Metadata): number {
        return Number(metadata.ticketId);
    }

}
