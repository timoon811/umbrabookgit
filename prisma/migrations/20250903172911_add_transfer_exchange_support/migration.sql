-- AlterEnum
ALTER TYPE "public"."TransactionType" ADD VALUE 'EXCHANGE';

-- AlterTable
ALTER TABLE "public"."finance_transactions" ADD COLUMN     "exchangeRate" DOUBLE PRECISION,
ADD COLUMN     "fromCurrency" TEXT,
ADD COLUMN     "toAccountId" TEXT,
ADD COLUMN     "toAmount" DOUBLE PRECISION,
ADD COLUMN     "toCurrency" TEXT;

-- CreateIndex
CREATE INDEX "finance_transactions_toAccountId_idx" ON "public"."finance_transactions"("toAccountId");

-- AddForeignKey
ALTER TABLE "public"."finance_transactions" ADD CONSTRAINT "finance_transactions_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "public"."finance_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
