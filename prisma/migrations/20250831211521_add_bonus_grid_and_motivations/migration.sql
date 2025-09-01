-- CreateEnum
CREATE TYPE "public"."MotivationType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateTable
CREATE TABLE "public"."bonus_grid" (
    "id" TEXT NOT NULL,
    "minAmount" DOUBLE PRECISION NOT NULL,
    "maxAmount" DOUBLE PRECISION,
    "bonusPercentage" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bonus_grid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bonus_motivations" (
    "id" TEXT NOT NULL,
    "type" "public"."MotivationType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "value" DOUBLE PRECISION NOT NULL,
    "conditions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bonus_motivations_pkey" PRIMARY KEY ("id")
);
