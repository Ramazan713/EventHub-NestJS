import { Injectable } from '@nestjs/common';
import { CheckoutSession } from './models/checkout.model';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { Event, TicketStatus } from '@prisma/client';
import { WebhookRequest } from './models/webhook-request.model';
import { PaymentResult } from './models/payment-result.model';
import { PaymentEvenType } from './enums/payment-even-type.enum';

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

    async refundPayment(paymentIntentId: string): Promise<void> {
        const response = await this.stripe.refunds.create({
            payment_intent: paymentIntentId
        })
        console.log("response", JSON.stringify(response, null, 2))
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
                    console.log(JSON.stringify(event, null, 2));
                    let eventId = this.getEventIdFromStripe(event.data.object.metadata);
                    console.log(`PaymentIntent for was successful! eventId: ${eventId}`);
                    return {
                        eventType: PaymentEvenType.CHARGE,
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
                        eventType: PaymentEvenType.CHARGE,
                        eventId: this.getEventIdFromStripe(event.data.object.metadata),
                        ticketId: this.getTicketIdFromStripe(event.data.object.metadata),
                        status: TicketStatus.CANCELLED,
                        paymentIntentId: event.data.object.id,
                        err: event.data.object.last_payment_error?.message
                    }
                case "refund.created":
                    console.log(JSON.stringify(event, null, 2));
                    return {
                        eventType: PaymentEvenType.REFUND,
                        status: TicketStatus.REFUNDED,
                        paymentIntentId: this.getPaymentIntentIdFromRefund(event.data.object),
                        err: null
                    }
                case "refund.failed":
                    console.log(JSON.stringify(event, null, 2));
                    return {
                        eventType: PaymentEvenType.REFUND,
                        status: TicketStatus.REFUND_FAILED,
                        paymentIntentId: this.getPaymentIntentIdFromRefund(event.data.object),
                        err: event.data.object.failure_reason
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

    private getPaymentIntentIdFromRefund(refund: Stripe.Refund): string | undefined {
        if(typeof refund.payment_intent === "string"){
            return refund.payment_intent;
        }
        return refund.payment_intent?.id
    }

}
