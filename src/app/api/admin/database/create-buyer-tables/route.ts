import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/auth';
import { requireAdminAuth } from '@/lib/api-auth';

const prisma = new PrismaClient();

const BUYER_TABLES_SQL = `
-- Создание всех таблиц системы байеров

-- Проекты байеров
CREATE TABLE IF NOT EXISTS "buyer_projects" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "offer" TEXT,
  "geo" TEXT,
  "trafficSource" TEXT,
  "attributionWindow" INTEGER NOT NULL DEFAULT 1,
  "attributionModel" TEXT NOT NULL DEFAULT 'DATE_BASED',
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
  "stopConditions" TEXT,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "buyer_projects_pkey" PRIMARY KEY ("id")
);

-- Дневники байеров
CREATE TABLE IF NOT EXISTS "buyer_daily_logs" (
  "id" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ftdCount" INTEGER NOT NULL DEFAULT 0,
  "ftdAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "redCount" INTEGER NOT NULL DEFAULT 0,
  "redAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalDeposits" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "averageCheck" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "registrations" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "status" "DailyLogStatus" NOT NULL DEFAULT 'DRAFT',
  "adminComment" TEXT,
  "moderatedAt" TIMESTAMP(3),
  "moderatedBy" TEXT,
  "lockedAt" TIMESTAMP(3),
  "lockedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "buyer_daily_logs_pkey" PRIMARY KEY ("id")
);

-- Заявки байеров
CREATE TABLE IF NOT EXISTS "buyer_requests" (
  "id" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "projectId" TEXT,
  "type" "RequestType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "amount" DOUBLE PRECISION,
  "deliveryMethod" TEXT,
  "payoutPeriod" TEXT,
  "walletAddress" TEXT,
  "items" TEXT,
  "status" "RequestStatus" NOT NULL DEFAULT 'DRAFT',
  "adminComment" TEXT,
  "processedAt" TIMESTAMP(3),
  "processedBy" TEXT,
  "fulfilledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "buyer_requests_pkey" PRIMARY KEY ("id")
);

-- Схемы бонусов для байеров
CREATE TABLE IF NOT EXISTS "buyer_bonus_schemes" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" "BonusSchemeType" NOT NULL,
  "percentage" DOUBLE PRECISION,
  "tiers" TEXT,
  "formula" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "buyer_bonus_schemes_pkey" PRIMARY KEY ("id")
);

-- Назначения схем бонусов байерам
CREATE TABLE IF NOT EXISTS "buyer_bonus_assignments" (
  "id" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "schemeId" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endDate" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "buyer_bonus_assignments_pkey" PRIMARY KEY ("id")
);

-- Общие расходы
CREATE TABLE IF NOT EXISTS "shared_costs" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "amount" DOUBLE PRECISION NOT NULL,
  "costType" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "isShared" BOOLEAN NOT NULL DEFAULT true,
  "allocationRule" TEXT NOT NULL DEFAULT 'BY_SPEND',
  "status" "SharedCostStatus" NOT NULL DEFAULT 'PLANNED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shared_costs_pkey" PRIMARY KEY ("id")
);

-- Аллокация общих расходов
CREATE TABLE IF NOT EXISTS "shared_cost_allocations" (
  "id" TEXT NOT NULL,
  "sharedCostId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "allocatedAmount" DOUBLE PRECISION NOT NULL,
  "percentage" DOUBLE PRECISION NOT NULL,
  "period" TEXT NOT NULL,
  "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shared_cost_allocations_pkey" PRIMARY KEY ("id")
);

-- Каталог расходников
CREATE TABLE IF NOT EXISTS "consumable_catalog" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT,
  "unit" TEXT NOT NULL DEFAULT 'шт',
  "basePrice" DOUBLE PRECISION,
  "isShared" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "consumable_catalog_pkey" PRIMARY KEY ("id")
);

-- Сигналы/алерты
CREATE TABLE IF NOT EXISTS "buyer_signals" (
  "id" TEXT NOT NULL,
  "buyerId" TEXT,
  "projectId" TEXT,
  "type" "SignalType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "severity" "SignalSeverity" NOT NULL DEFAULT 'MEDIUM',
  "status" "SignalStatus" NOT NULL DEFAULT 'ACTIVE',
  "metadata" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "resolvedBy" TEXT,
  "adminComment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "buyer_signals_pkey" PRIMARY KEY ("id")
);

-- Таблица для проекций разрешений
CREATE TABLE IF NOT EXISTS "project_permissions" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_permissions_pkey" PRIMARY KEY ("id")
);

-- Создаем индексы
CREATE INDEX IF NOT EXISTS "buyer_projects_buyerId_idx" ON "buyer_projects"("buyerId");
CREATE INDEX IF NOT EXISTS "buyer_projects_status_idx" ON "buyer_projects"("status");

CREATE INDEX IF NOT EXISTS "buyer_daily_logs_buyerId_idx" ON "buyer_daily_logs"("buyerId");
CREATE INDEX IF NOT EXISTS "buyer_daily_logs_projectId_idx" ON "buyer_daily_logs"("projectId");
CREATE INDEX IF NOT EXISTS "buyer_daily_logs_date_idx" ON "buyer_daily_logs"("date");
CREATE INDEX IF NOT EXISTS "buyer_daily_logs_status_idx" ON "buyer_daily_logs"("status");

CREATE INDEX IF NOT EXISTS "buyer_requests_buyerId_idx" ON "buyer_requests"("buyerId");
CREATE INDEX IF NOT EXISTS "buyer_requests_projectId_idx" ON "buyer_requests"("projectId");
CREATE INDEX IF NOT EXISTS "buyer_requests_type_idx" ON "buyer_requests"("type");
CREATE INDEX IF NOT EXISTS "buyer_requests_status_idx" ON "buyer_requests"("status");

CREATE INDEX IF NOT EXISTS "buyer_bonus_assignments_buyerId_idx" ON "buyer_bonus_assignments"("buyerId");
CREATE INDEX IF NOT EXISTS "buyer_bonus_assignments_schemeId_idx" ON "buyer_bonus_assignments"("schemeId");
CREATE INDEX IF NOT EXISTS "buyer_bonus_assignments_startDate_idx" ON "buyer_bonus_assignments"("startDate");

CREATE INDEX IF NOT EXISTS "shared_costs_status_idx" ON "shared_costs"("status");
CREATE INDEX IF NOT EXISTS "shared_costs_costType_idx" ON "shared_costs"("costType");

CREATE INDEX IF NOT EXISTS "shared_cost_allocations_buyerId_idx" ON "shared_cost_allocations"("buyerId");
CREATE INDEX IF NOT EXISTS "shared_cost_allocations_period_idx" ON "shared_cost_allocations"("period");

CREATE INDEX IF NOT EXISTS "consumable_catalog_category_idx" ON "consumable_catalog"("category");
CREATE INDEX IF NOT EXISTS "consumable_catalog_isActive_idx" ON "consumable_catalog"("isActive");

CREATE INDEX IF NOT EXISTS "buyer_signals_buyerId_idx" ON "buyer_signals"("buyerId");
CREATE INDEX IF NOT EXISTS "buyer_signals_projectId_idx" ON "buyer_signals"("projectId");
CREATE INDEX IF NOT EXISTS "buyer_signals_type_idx" ON "buyer_signals"("type");
CREATE INDEX IF NOT EXISTS "buyer_signals_status_idx" ON "buyer_signals"("status");

CREATE INDEX IF NOT EXISTS "project_permissions_projectId_idx" ON "project_permissions"("projectId");
CREATE INDEX IF NOT EXISTS "project_permissions_role_idx" ON "project_permissions"("role");

-- Создаем уникальные ограничения
CREATE UNIQUE INDEX IF NOT EXISTS "buyer_daily_logs_projectId_date_key" ON "buyer_daily_logs"("projectId", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "shared_cost_allocations_sharedCostId_projectId_period_key" ON "shared_cost_allocations"("sharedCostId", "projectId", "period");
CREATE UNIQUE INDEX IF NOT EXISTS "project_permissions_projectId_role_key" ON "project_permissions"("projectId", "role");

-- Добавляем внешние ключи
ALTER TABLE "buyer_projects" ADD CONSTRAINT IF NOT EXISTS "buyer_projects_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "buyer_daily_logs" ADD CONSTRAINT IF NOT EXISTS "buyer_daily_logs_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "buyer_daily_logs" ADD CONSTRAINT IF NOT EXISTS "buyer_daily_logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "buyer_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "buyer_daily_logs" ADD CONSTRAINT IF NOT EXISTS "buyer_daily_logs_moderatedBy_fkey" FOREIGN KEY ("moderatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "buyer_daily_logs" ADD CONSTRAINT IF NOT EXISTS "buyer_daily_logs_lockedBy_fkey" FOREIGN KEY ("lockedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "buyer_requests" ADD CONSTRAINT IF NOT EXISTS "buyer_requests_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "buyer_requests" ADD CONSTRAINT IF NOT EXISTS "buyer_requests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "buyer_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "buyer_requests" ADD CONSTRAINT IF NOT EXISTS "buyer_requests_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "buyer_bonus_assignments" ADD CONSTRAINT IF NOT EXISTS "buyer_bonus_assignments_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "buyer_bonus_assignments" ADD CONSTRAINT IF NOT EXISTS "buyer_bonus_assignments_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "buyer_bonus_schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shared_cost_allocations" ADD CONSTRAINT IF NOT EXISTS "shared_cost_allocations_sharedCostId_fkey" FOREIGN KEY ("sharedCostId") REFERENCES "shared_costs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shared_cost_allocations" ADD CONSTRAINT IF NOT EXISTS "shared_cost_allocations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "buyer_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shared_cost_allocations" ADD CONSTRAINT IF NOT EXISTS "shared_cost_allocations_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "buyer_signals" ADD CONSTRAINT IF NOT EXISTS "buyer_signals_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "buyer_signals" ADD CONSTRAINT IF NOT EXISTS "buyer_signals_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "buyer_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "buyer_signals" ADD CONSTRAINT IF NOT EXISTS "buyer_signals_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "project_permissions" ADD CONSTRAINT IF NOT EXISTS "project_permissions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "content_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
`;

export async function POST(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await requireAdmin(request);

    // Выполняем создание всех таблиц buyer системы
    await prisma.$executeRawUnsafe(BUYER_TABLES_SQL);

    return NextResponse.json({ 
      success: true, 
      message: 'Все таблицы buyer системы созданы успешно' 
    });

  } catch (error: any) {
    console.error('Error creating buyer tables:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
