-- AddColumn
ALTER TABLE "processor_deposits" ADD COLUMN     "platformCommissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "processor_deposits" ADD COLUMN     "platformCommissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "processor_deposits" ADD COLUMN     "processorEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0;
