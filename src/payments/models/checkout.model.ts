import Stripe from "stripe"


export class CheckoutSession {
    checkoutUrl: string | null
    paymentSessionId: string
}