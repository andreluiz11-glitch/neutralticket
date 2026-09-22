ALTER TABLE "Order" ADD COLUMN "providerCheckoutId" TEXT;
CREATE UNIQUE INDEX "Order_providerCheckoutId_key" ON "Order"("providerCheckoutId");
