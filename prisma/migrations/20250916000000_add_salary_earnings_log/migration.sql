-- CreateEnum
CREATE TYPE "public"."EarningsType" AS ENUM ('BASE_SALARY', 'DEPOSIT_COMMISSION', 'SHIFT_BONUS', 'MONTHLY_BONUS', 'ACHIEVEMENT_BONUS', 'OVERTIME_BONUS', 'MANUAL_ADJUSTMENT');

-- CreateTable
CREATE TABLE "public"."salary_earnings_log" (
    "id" TEXT NOT NULL,
    "processorId" TEXT NOT NULL,
    "shiftId" TEXT,
    "depositId" TEXT,
    "salaryRequestId" TEXT,
    "type" "public"."EarningsType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "baseAmount" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "calculationDetails" TEXT,
    "metadata" TEXT,
    "period" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "isIncludedInSalary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_earnings_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salary_request_log" (
    "id" TEXT NOT NULL,
    "salaryRequestId" TEXT NOT NULL,
    "processorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "amount" DOUBLE PRECISION,
    "adminId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salary_request_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "salary_earnings_log_processorId_idx" ON "public"."salary_earnings_log"("processorId");

-- CreateIndex
CREATE INDEX "salary_earnings_log_shiftId_idx" ON "public"."salary_earnings_log"("shiftId");

-- CreateIndex
CREATE INDEX "salary_earnings_log_type_idx" ON "public"."salary_earnings_log"("type");

-- CreateIndex
CREATE INDEX "salary_earnings_log_period_idx" ON "public"."salary_earnings_log"("period");

-- CreateIndex
CREATE INDEX "salary_earnings_log_processedAt_idx" ON "public"."salary_earnings_log"("processedAt");

-- CreateIndex
CREATE INDEX "salary_earnings_log_isIncludedInSalary_idx" ON "public"."salary_earnings_log"("isIncludedInSalary");

-- CreateIndex
CREATE INDEX "salary_request_log_salaryRequestId_idx" ON "public"."salary_request_log"("salaryRequestId");

-- CreateIndex
CREATE INDEX "salary_request_log_processorId_idx" ON "public"."salary_request_log"("processorId");

-- CreateIndex
CREATE INDEX "salary_request_log_action_idx" ON "public"."salary_request_log"("action");

-- CreateIndex
CREATE INDEX "salary_request_log_createdAt_idx" ON "public"."salary_request_log"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."salary_earnings_log" ADD CONSTRAINT "salary_earnings_log_processorId_fkey" FOREIGN KEY ("processorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salary_earnings_log" ADD CONSTRAINT "salary_earnings_log_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "public"."processor_shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salary_earnings_log" ADD CONSTRAINT "salary_earnings_log_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "public"."processor_deposits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salary_earnings_log" ADD CONSTRAINT "salary_earnings_log_salaryRequestId_fkey" FOREIGN KEY ("salaryRequestId") REFERENCES "public"."salary_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salary_request_log" ADD CONSTRAINT "salary_request_log_salaryRequestId_fkey" FOREIGN KEY ("salaryRequestId") REFERENCES "public"."salary_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salary_request_log" ADD CONSTRAINT "salary_request_log_processorId_fkey" FOREIGN KEY ("processorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salary_request_log" ADD CONSTRAINT "salary_request_log_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
