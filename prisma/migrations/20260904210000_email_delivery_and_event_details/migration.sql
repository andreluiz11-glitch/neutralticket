-- Preserve event information on each purchase and track e-mail delivery.
ALTER TABLE "Order"
ADD COLUMN "emailMessageId" TEXT,
ADD COLUMN "emailDeliveryStatus" TEXT,
ADD COLUMN "emailSentAt" TIMESTAMP(3),
ADD COLUMN "emailDeliveredAt" TIMESTAMP(3),
ADD COLUMN "emailLastError" TEXT;

ALTER TABLE "OrderItem"
ADD COLUMN "eventDate" TEXT,
ADD COLUMN "eventLocation" TEXT;

ALTER TABLE "Ticket"
ADD COLUMN "eventDate" TEXT,
ADD COLUMN "eventLocation" TEXT;

CREATE INDEX "Order_emailMessageId_idx" ON "Order"("emailMessageId");
