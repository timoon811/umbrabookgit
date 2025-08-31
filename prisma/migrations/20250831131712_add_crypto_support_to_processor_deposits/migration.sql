-- AlterTable
ALTER TABLE "public"."processor_deposits" ADD COLUMN     "currencyType" TEXT NOT NULL DEFAULT 'FIAT',
ADD COLUMN     "playerEmail" TEXT;

-- CreateIndex
CREATE INDEX "processor_deposits_currency_idx" ON "public"."processor_deposits"("currency");

-- CreateIndex
CREATE INDEX "processor_deposits_currencyType_idx" ON "public"."processor_deposits"("currencyType");

-- CreateIndex
CREATE INDEX "processor_deposits_playerEmail_idx" ON "public"."processor_deposits"("playerEmail");
