import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    
    const body = await request.json();
    const { action, targetTable, targetColumn } = body;

    let result: any = {};

    switch (action) {
      case 'run_full_migration':
        result = await runFullMigration();
        break;
      
      case 'create_missing_table':
        if (!targetTable) {
          throw new Error('targetTable is required for create_missing_table action');
        }
        result = await createMissingTable(targetTable);
        break;
      
      case 'add_missing_column':
        if (!targetTable || !targetColumn) {
          throw new Error('targetTable and targetColumn are required for add_missing_column action');
        }
        result = await addMissingColumn(targetTable, targetColumn);
        break;
      
      case 'reset_database':
        result = await resetDatabase();
        break;
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return NextResponse.json({ success: true, result });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function runFullMigration() {
  // Применение всех недостающих элементов БД
  
  // 1. Создаем enum типы если их нет
  const enumCreationQueries = [
    `DO $$ BEGIN
      CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR', 'MEDIA_BUYER', 'SUPPORT', 'PROCESSOR', 'ROP_PROCESSOR', 'ROP_BUYER', 'BUYER', 'LEAD_BUYER', 'FINANCE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE "SalaryRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE "BonusType" AS ENUM ('DEPOSIT_BONUS', 'PERIODIC_BONUS', 'ACHIEVEMENT_BONUS', 'MANUAL_BONUS');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE "BonusStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID', 'BURNED', 'HELD');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE "EarningsType" AS ENUM ('BASE_SALARY', 'DEPOSIT_COMMISSION', 'SHIFT_BONUS', 'MONTHLY_BONUS', 'ACHIEVEMENT_BONUS', 'OVERTIME_BONUS', 'MANUAL_ADJUSTMENT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE "ShiftType" AS ENUM ('MORNING', 'DAY', 'NIGHT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE "ShiftStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'MISSED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE "PenaltyStatus" AS ENUM ('PENDING', 'APPLIED', 'CANCELLED', 'APPEALED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE "PenaltyType" AS ENUM ('SHIFT_MISS', 'LATE_ARRIVAL', 'EARLY_DEPARTURE', 'OTHER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE "MotivationType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE "DailyLogStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'LOCKED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE "RequestType" AS ENUM ('BUDGET', 'CONSUMABLES', 'ACCESS', 'PAYOUT', 'CUSTOM');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'FULFILLED', 'CLOSED', 'PAID');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE "BonusSchemeType" AS ENUM ('FIFTY_FIFTY', 'TIER_SYSTEM', 'CUSTOM_FORMULA');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE "SharedCostStatus" AS ENUM ('PLANNED', 'ACTIVE', 'ALLOCATED', 'ARCHIVED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE "SignalType" AS ENUM ('ROAS_DROP', 'ANOMALY', 'MISSING_LOG', 'OVERSPEND', 'CUSTOM');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE "SignalSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    
    `DO $$ BEGIN
      CREATE TYPE "SignalStatus" AS ENUM ('ACTIVE', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`
  ];

  // Выполняем создание enum типов
  for (const query of enumCreationQueries) {
    await prisma.$executeRawUnsafe(query);
  }

  // 2. Добавляем недостающие колонки в существующие таблицы
  const columnUpdates = [
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "assignedBuyerId" TEXT;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "leadBuyerId" TEXT;`,
    `ALTER TABLE "processor_deposits" ADD COLUMN IF NOT EXISTS "platformCommissionPercent" DOUBLE PRECISION DEFAULT 0;`,
    `ALTER TABLE "processor_deposits" ADD COLUMN IF NOT EXISTS "platformCommissionAmount" DOUBLE PRECISION DEFAULT 0;`,
    `ALTER TABLE "processor_deposits" ADD COLUMN IF NOT EXISTS "processorEarnings" DOUBLE PRECISION DEFAULT 0;`,
    `ALTER TABLE "documentation_sections" ADD COLUMN IF NOT EXISTS "projectId" TEXT;`,
  ];

  for (const query of columnUpdates) {
    await prisma.$executeRawUnsafe(query);
  }

  return { message: 'Full migration completed successfully' };
}

async function createMissingTable(tableName: string) {
  // Здесь можно добавить SQL для создания конкретных таблиц
  const tableCreationQueries: Record<string, string> = {
    'goal_types': `
      CREATE TABLE IF NOT EXISTS "goal_types" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "unit" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "goal_types_pkey" PRIMARY KEY ("id")
      );`,
    
    'user_goals': `
      CREATE TABLE IF NOT EXISTS "user_goals" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "goalTypeId" TEXT NOT NULL,
        "periodType" TEXT NOT NULL DEFAULT 'DAILY',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "user_goals_pkey" PRIMARY KEY ("id")
      );`,
    
    'goal_stages': `
      CREATE TABLE IF NOT EXISTS "goal_stages" (
        "id" TEXT NOT NULL,
        "goalId" TEXT NOT NULL,
        "stage" INTEGER NOT NULL,
        "targetValue" DOUBLE PRECISION NOT NULL,
        "rewardAmount" DOUBLE PRECISION NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "goal_stages_pkey" PRIMARY KEY ("id")
      );`,
    
    'user_goal_achievements': `
      CREATE TABLE IF NOT EXISTS "user_goal_achievements" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "goalId" TEXT NOT NULL,
        "stageId" TEXT NOT NULL,
        "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "achievedValue" DOUBLE PRECISION NOT NULL,
        "rewardAmount" DOUBLE PRECISION NOT NULL,
        "period" TEXT NOT NULL,
        "isRewarded" BOOLEAN NOT NULL DEFAULT false,
        "rewardedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "user_goal_achievements_pkey" PRIMARY KEY ("id")
      );`
  };

  if (tableCreationQueries[tableName]) {
    await prisma.$executeRawUnsafe(tableCreationQueries[tableName]);
    return { message: `Table ${tableName} created successfully` };
  } else {
    throw new Error(`No creation query found for table: ${tableName}`);
  }
}

async function addMissingColumn(tableName: string, columnName: string) {
  const columnDefinitions: Record<string, Record<string, string>> = {
    'users': {
      'assignedBuyerId': 'TEXT',
      'leadBuyerId': 'TEXT'
    },
    'processor_deposits': {
      'platformCommissionPercent': 'DOUBLE PRECISION DEFAULT 0',
      'platformCommissionAmount': 'DOUBLE PRECISION DEFAULT 0',
      'processorEarnings': 'DOUBLE PRECISION DEFAULT 0'
    },
    'documentation_sections': {
      'projectId': 'TEXT'
    }
  };

  const columnDef = columnDefinitions[tableName]?.[columnName];
  if (!columnDef) {
    throw new Error(`No column definition found for ${tableName}.${columnName}`);
  }

  const query = `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${columnName}" ${columnDef};`;
  await prisma.$executeRawUnsafe(query);
  
  return { message: `Column ${tableName}.${columnName} added successfully` };
}

async function resetDatabase() {
  // ВНИМАНИЕ: Это полный сброс БД!
  throw new Error('Database reset is not implemented for safety reasons. Use Prisma migrate reset locally.');
}
