-- AlterTable
ALTER TABLE "public"."documentation_sections" ADD COLUMN     "projectId" TEXT;

-- CreateTable
CREATE TABLE "public"."content_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'documentation',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shift_settings" (
    "id" TEXT NOT NULL,
    "shiftType" "public"."ShiftType" NOT NULL,
    "startHour" INTEGER NOT NULL DEFAULT 6,
    "startMinute" INTEGER NOT NULL DEFAULT 0,
    "endHour" INTEGER NOT NULL DEFAULT 14,
    "endMinute" INTEGER NOT NULL DEFAULT 0,
    "timezone" TEXT NOT NULL DEFAULT '+3',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salary_settings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salary_deposit_grid" (
    "id" TEXT NOT NULL,
    "salarySettingsId" TEXT,
    "minAmount" DOUBLE PRECISION NOT NULL,
    "maxAmount" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_deposit_grid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salary_monthly_bonus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "minAmount" DOUBLE PRECISION NOT NULL,
    "bonusPercent" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_monthly_bonus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shift_settings_shiftType_key" ON "public"."shift_settings"("shiftType");

-- AddForeignKey
ALTER TABLE "public"."documentation_sections" ADD CONSTRAINT "documentation_sections_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."content_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
