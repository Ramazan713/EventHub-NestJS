/*
  Warnings:

  - A unique constraint covering the columns `[paymentIntentId]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "TicketStatus" ADD VALUE 'REFUND_FAILED';

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "failedReason" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "paymentSessionId" TEXT,
ADD COLUMN     "refundedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_paymentIntentId_key" ON "Ticket"("paymentIntentId");
