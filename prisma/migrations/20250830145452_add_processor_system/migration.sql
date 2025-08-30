-- CreateEnum
CREATE TYPE "public"."DepositStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING');

-- CreateEnum
CREATE TYPE "public"."SalaryRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "public"."BonusType" AS ENUM ('DEPOSIT_BONUS', 'PERIODIC_BONUS', 'ACHIEVEMENT_BONUS', 'MANUAL_BONUS');

-- CreateEnum
CREATE TYPE "public"."BonusStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');

-- AlterEnum
ALTER TYPE "public"."UserRole" ADD VALUE 'PROCESSOR';

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "assignedBuyerId" TEXT;

-- CreateTable
CREATE TABLE "public"."processor_deposits" (
    "id" TEXT NOT NULL,
    "processorId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerNick" TEXT,
    "offerId" TEXT,
    "offerName" TEXT,
    "geo" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" TEXT,
    "leadSource" TEXT,
    "proofs" TEXT,
    "notes" TEXT,
    "status" "public"."DepositStatus" NOT NULL DEFAULT 'PENDING',
    "moderatorId" TEXT,
    "moderatorComment" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 30.0,
    "bonusRate" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "bonusAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processor_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salary_requests" (
    "id" TEXT NOT NULL,
    "processorId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "requestedAmount" DOUBLE PRECISION NOT NULL,
    "calculatedAmount" DOUBLE PRECISION,
    "paymentDetails" TEXT,
    "comment" TEXT,
    "adminComment" TEXT,
    "status" "public"."SalaryRequestStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bonus_payments" (
    "id" TEXT NOT NULL,
    "processorId" TEXT NOT NULL,
    "type" "public"."BonusType" NOT NULL DEFAULT 'DEPOSIT_BONUS',
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "depositId" TEXT,
    "period" TIMESTAMP(3),
    "conditions" TEXT,
    "status" "public"."BonusStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bonus_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bonus_settings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "baseCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 30.0,
    "baseBonusRate" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "tiers" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bonus_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "processor_deposits_processorId_idx" ON "public"."processor_deposits"("processorId");

-- CreateIndex
CREATE INDEX "processor_deposits_playerId_idx" ON "public"."processor_deposits"("playerId");

-- CreateIndex
CREATE INDEX "processor_deposits_status_idx" ON "public"."processor_deposits"("status");

-- CreateIndex
CREATE INDEX "processor_deposits_createdAt_idx" ON "public"."processor_deposits"("createdAt");

-- CreateIndex
CREATE INDEX "salary_requests_processorId_idx" ON "public"."salary_requests"("processorId");

-- CreateIndex
CREATE INDEX "salary_requests_status_idx" ON "public"."salary_requests"("status");

-- CreateIndex
CREATE INDEX "salary_requests_periodStart_idx" ON "public"."salary_requests"("periodStart");

-- CreateIndex
CREATE INDEX "salary_requests_periodEnd_idx" ON "public"."salary_requests"("periodEnd");

-- CreateIndex
CREATE INDEX "bonus_payments_processorId_idx" ON "public"."bonus_payments"("processorId");

-- CreateIndex
CREATE INDEX "bonus_payments_type_idx" ON "public"."bonus_payments"("type");

-- CreateIndex
CREATE INDEX "bonus_payments_status_idx" ON "public"."bonus_payments"("status");

-- CreateIndex
CREATE INDEX "bonus_payments_period_idx" ON "public"."bonus_payments"("period");

-- CreateIndex
CREATE INDEX "users_assignedBuyerId_idx" ON "public"."users"("assignedBuyerId");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_assignedBuyerId_fkey" FOREIGN KEY ("assignedBuyerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."processor_deposits" ADD CONSTRAINT "processor_deposits_processorId_fkey" FOREIGN KEY ("processorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salary_requests" ADD CONSTRAINT "salary_requests_processorId_fkey" FOREIGN KEY ("processorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bonus_payments" ADD CONSTRAINT "bonus_payments_processorId_fkey" FOREIGN KEY ("processorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
