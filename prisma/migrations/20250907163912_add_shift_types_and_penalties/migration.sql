-- CreateEnum
CREATE TYPE "public"."PenaltyStatus" AS ENUM ('PENDING', 'APPLIED', 'CANCELLED', 'APPEALED');

-- CreateEnum
CREATE TYPE "public"."PenaltyType" AS ENUM ('SHIFT_MISS', 'LATE_ARRIVAL', 'EARLY_DEPARTURE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ShiftType" AS ENUM ('MORNING', 'DAY', 'NIGHT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."BonusStatus" ADD VALUE 'BURNED';
ALTER TYPE "public"."BonusStatus" ADD VALUE 'HELD';

-- AlterTable
ALTER TABLE "public"."bonus_grid" ADD COLUMN     "fixedBonus" DOUBLE PRECISION,
ADD COLUMN     "fixedBonusMin" DOUBLE PRECISION,
ADD COLUMN     "shiftType" "public"."ShiftType" NOT NULL DEFAULT 'MORNING';

-- AlterTable
ALTER TABLE "public"."bonus_payments" ADD COLUMN     "burnReason" TEXT,
ADD COLUMN     "burnedAt" TIMESTAMP(3),
ADD COLUMN     "holdUntil" TIMESTAMP(3),
ADD COLUMN     "shiftType" "public"."ShiftType";

-- CreateTable
CREATE TABLE "public"."shift_penalties" (
    "id" TEXT NOT NULL,
    "processorId" TEXT NOT NULL,
    "type" "public"."PenaltyType" NOT NULL DEFAULT 'SHIFT_MISS',
    "shiftType" "public"."ShiftType",
    "shiftDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT -50.0,
    "reason" TEXT,
    "adminComment" TEXT,
    "status" "public"."PenaltyStatus" NOT NULL DEFAULT 'APPLIED',
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_penalties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shift_penalties_processorId_idx" ON "public"."shift_penalties"("processorId");

-- CreateIndex
CREATE INDEX "shift_penalties_type_idx" ON "public"."shift_penalties"("type");

-- CreateIndex
CREATE INDEX "shift_penalties_shiftDate_idx" ON "public"."shift_penalties"("shiftDate");

-- CreateIndex
CREATE INDEX "shift_penalties_status_idx" ON "public"."shift_penalties"("status");

-- CreateIndex
CREATE INDEX "bonus_payments_shiftType_idx" ON "public"."bonus_payments"("shiftType");

-- AddForeignKey
ALTER TABLE "public"."shift_penalties" ADD CONSTRAINT "shift_penalties_processorId_fkey" FOREIGN KEY ("processorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
