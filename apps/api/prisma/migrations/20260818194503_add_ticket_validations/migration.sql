-- CreateEnum
CREATE TYPE "TicketValidationResult" AS ENUM ('VALID', 'INVALID', 'EVENT_WRONG', 'ALREADY_USED');

-- CreateTable
CREATE TABLE "TicketValidation" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT,
    "eventId" TEXT NOT NULL,
    "gatekeeperId" TEXT NOT NULL,
    "result" "TicketValidationResult" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketValidation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketValidation_eventId_createdAt_idx" ON "TicketValidation"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "TicketValidation_gatekeeperId_createdAt_idx" ON "TicketValidation"("gatekeeperId", "createdAt");

-- CreateIndex
CREATE INDEX "TicketValidation_ticketId_idx" ON "TicketValidation"("ticketId");

-- AddForeignKey
ALTER TABLE "TicketValidation" ADD CONSTRAINT "TicketValidation_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketValidation" ADD CONSTRAINT "TicketValidation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketValidation" ADD CONSTRAINT "TicketValidation_gatekeeperId_fkey" FOREIGN KEY ("gatekeeperId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
