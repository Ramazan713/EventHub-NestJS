import { CreateTicketPayload } from "@/graphql-types"


export class CheckoutSession implements CreateTicketPayload {
    checkoutUrl: string | null
    paymentSessionId: string
}