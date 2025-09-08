-- CreateEnum
CREATE TYPE "public"."ShiftStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'MISSED');

-- CreateTable
CREATE TABLE "public"."processor_shifts" (
    "id" TEXT NOT NULL,
    "processorId" TEXT NOT NULL,
    "shiftType" "public"."ShiftType" NOT NULL DEFAULT 'MORNING',
    "shiftDate" TIMESTAMP(3) NOT NULL,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "status" "public"."ShiftStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processor_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "processor_shifts_processorId_idx" ON "public"."processor_shifts"("processorId");

-- CreateIndex
CREATE INDEX "processor_shifts_shiftType_idx" ON "public"."processor_shifts"("shiftType");

-- CreateIndex
CREATE INDEX "processor_shifts_shiftDate_idx" ON "public"."processor_shifts"("shiftDate");

-- CreateIndex
CREATE INDEX "processor_shifts_status_idx" ON "public"."processor_shifts"("status");

-- AddForeignKey
ALTER TABLE "public"."processor_shifts" ADD CONSTRAINT "processor_shifts_processorId_fkey" FOREIGN KEY ("processorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
