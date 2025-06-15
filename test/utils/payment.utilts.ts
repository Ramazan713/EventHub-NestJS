import * as fs from 'fs';
import * as path from 'path';

export class PaymentTestUtils {


    static getSuccessedPayload(metadata: { ticketId: number, eventId: number }): string {
        const template = this.getTemplate("../e2e/fixtures/payment_intent.succeeded.template.json")
        template.data.object.metadata = metadata;

        return  JSON.stringify(template);
    }

    static getFailedPayload(metadata: { ticketId: number, eventId: number }): string {
        const template = this.getTemplate("../e2e/fixtures/payment_intent.payment_failed.template.json")
        template.data.object.metadata = metadata;

        return  JSON.stringify(template);
    }

    private static getTemplate(filePath: string): any {
        return JSON.parse(
            fs.readFileSync(path.join(__dirname, filePath), 'utf8')
        )
    }

}