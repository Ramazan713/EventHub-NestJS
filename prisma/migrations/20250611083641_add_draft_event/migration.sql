/*
  Warnings:

  - You are about to drop the column `isPublished` on the `Event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "isPublished",
ADD COLUMN     "draftId" INTEGER;

-- CreateTable
CREATE TABLE "DraftEvent" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "EventCategory" NOT NULL DEFAULT 'OTHER',
    "date" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "capacity" INTEGER,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizerId" INTEGER NOT NULL,
    "originalEventId" INTEGER,

    CONSTRAINT "DraftEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DraftEvent_originalEventId_key" ON "DraftEvent"("originalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "DraftEvent_organizerId_originalEventId_key" ON "DraftEvent"("organizerId", "originalEventId");

-- AddForeignKey
ALTER TABLE "DraftEvent" ADD CONSTRAINT "DraftEvent_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftEvent" ADD CONSTRAINT "DraftEvent_originalEventId_fkey" FOREIGN KEY ("originalEventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
