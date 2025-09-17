import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from '@/lib/api-auth';

// Полный аудит базы данных и применение всех миграций
export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    // Проверяем все таблицы из схемы
    const expectedTables = [
      'users', 'courses', 'course_sections', 'course_pages', 
      'documentation_sections', 'documentation', 'finance_accounts',
      'finance_counterparties', 'finance_categories', 'finance_projects', 
      'finance_transactions', 'deposit_sources', 'deposits', 'analytics',
      'articles', 'content_projects', 'project_permissions',
      'processor_deposits', 'salary_requests', 'salary_earnings_log',
      'salary_request_log', 'bonus_payments', 'bonus_settings',
      'processor_shifts', 'shift_settings', 'shift_penalties',
      'salary_settings', 'salary_deposit_grid', 'salary_monthly_bonus',
      'user_shift_assignments', 'bonus_grid', 'bonus_motivations',
      'platform_commission', 'goal_types', 'user_goals', 'goal_stages',
      'user_goal_achievements', 'buyer_projects', 'buyer_daily_logs',
      'buyer_requests', 'buyer_bonus_schemes', 'buyer_bonus_assignments',
      'shared_costs', 'shared_cost_allocations', 'consumable_catalog',
      'buyer_signals'
    ];

    // Проверяем существующие таблицы
    const existingTablesResult = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ` as Array<{ table_name: string }>;

    const existingTables = existingTablesResult.map(row => row.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));

    // Проверяем колонки в processor_deposits
    const processorDepositColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'processor_deposits'
    ` as Array<{ column_name: string }>;

    const requiredColumns = ['platformCommissionPercent', 'platformCommissionAmount', 'processorEarnings'];
    const existingColumns = processorDepositColumns.map(row => row.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    // Проверяем _prisma_migrations таблицу
    const appliedMigrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at 
      FROM _prisma_migrations 
      ORDER BY finished_at DESC
    ` as Array<{ migration_name: string; finished_at: Date }>;

    return NextResponse.json({
      success: true,
      audit: {
        expectedTables: expectedTables.length,
        existingTables: existingTables.length,
        missingTables: missingTables,
        processorDepositsColumns: {
          existing: existingColumns,
          missing: missingColumns
        },
        appliedMigrations: appliedMigrations.slice(0, 5), // Последние 5 миграций
        needsFullMigration: missingTables.length > 0 || missingColumns.length > 0
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка аудита базы данных:", error);
    return NextResponse.json(
      { 
        error: "Ошибка аудита базы данных", 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

// Применение полной миграции
export async function POST(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    const { secret, action } = await request.json();
    
    if (secret !== "migrate_2025_full") {
      return NextResponse.json(
        { error: "Неверный секретный ключ" },
        { status: 403 }
      );
    }

    const results = [];

    if (action === "apply_all_migrations") {
      // Применяем все отсутствующие миграции
      try {
        // 1. Проверяем и добавляем колонки в processor_deposits
        const processorColumns = await prisma.$queryRaw`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'processor_deposits'
          AND column_name IN ('platformCommissionPercent', 'platformCommissionAmount', 'processorEarnings')
        ` as Array<{ column_name: string }>;

        const existingCols = processorColumns.map(row => row.column_name);
        
        if (!existingCols.includes('platformCommissionPercent')) {
          await prisma.$executeRaw`
            ALTER TABLE "processor_deposits" 
            ADD COLUMN "platformCommissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0
          `;
          results.push('Added platformCommissionPercent column');
        }

        if (!existingCols.includes('platformCommissionAmount')) {
          await prisma.$executeRaw`
            ALTER TABLE "processor_deposits" 
            ADD COLUMN "platformCommissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0
          `;
          results.push('Added platformCommissionAmount column');
        }

        if (!existingCols.includes('processorEarnings')) {
          await prisma.$executeRaw`
            ALTER TABLE "processor_deposits" 
            ADD COLUMN "processorEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0
          `;
          results.push('Added processorEarnings column');
        }

        // 2. Проверяем существование таблицы user_goals
        const userGoalsExists = await prisma.$queryRaw`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_goals'
        ` as Array<{ table_name: string }>;

        if (userGoalsExists.length === 0) {
          // Создаем связанные таблицы для системы целей
          await prisma.$executeRaw`
            CREATE TABLE "goal_types" (
              "id" TEXT NOT NULL,
              "name" TEXT NOT NULL,
              "description" TEXT,
              "unit" TEXT NOT NULL,
              "type" TEXT NOT NULL,
              "isActive" BOOLEAN NOT NULL DEFAULT true,
              "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updatedAt" TIMESTAMP(3) NOT NULL,
              
              CONSTRAINT "goal_types_pkey" PRIMARY KEY ("id")
            )
          `;

          await prisma.$executeRaw`
            CREATE TABLE "user_goals" (
              "id" TEXT NOT NULL,
              "name" TEXT NOT NULL,
              "description" TEXT,
              "goalTypeId" TEXT NOT NULL,
              "periodType" TEXT NOT NULL DEFAULT 'DAILY',
              "isActive" BOOLEAN NOT NULL DEFAULT true,
              "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updatedAt" TIMESTAMP(3) NOT NULL,
              
              CONSTRAINT "user_goals_pkey" PRIMARY KEY ("id")
            )
          `;

          await prisma.$executeRaw`
            CREATE TABLE "goal_stages" (
              "id" TEXT NOT NULL,
              "goalId" TEXT NOT NULL,
              "stage" INTEGER NOT NULL,
              "targetValue" DOUBLE PRECISION NOT NULL,
              "rewardAmount" DOUBLE PRECISION NOT NULL,
              "title" TEXT NOT NULL,
              "description" TEXT,
              "isActive" BOOLEAN NOT NULL DEFAULT true,
              "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              "updatedAt" TIMESTAMP(3) NOT NULL,
              
              CONSTRAINT "goal_stages_pkey" PRIMARY KEY ("id")
            )
          `;

          await prisma.$executeRaw`
            CREATE TABLE "user_goal_achievements" (
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
            )
          `;

          // Добавляем внешние ключи
          await prisma.$executeRaw`
            ALTER TABLE "user_goals" 
            ADD CONSTRAINT "user_goals_goalTypeId_fkey" 
            FOREIGN KEY ("goalTypeId") REFERENCES "goal_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE
          `;

          await prisma.$executeRaw`
            ALTER TABLE "goal_stages" 
            ADD CONSTRAINT "goal_stages_goalId_fkey" 
            FOREIGN KEY ("goalId") REFERENCES "user_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE
          `;

          await prisma.$executeRaw`
            ALTER TABLE "user_goal_achievements" 
            ADD CONSTRAINT "user_goal_achievements_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
          `;

          await prisma.$executeRaw`
            ALTER TABLE "user_goal_achievements" 
            ADD CONSTRAINT "user_goal_achievements_goalId_fkey" 
            FOREIGN KEY ("goalId") REFERENCES "user_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE
          `;

          await prisma.$executeRaw`
            ALTER TABLE "user_goal_achievements" 
            ADD CONSTRAINT "user_goal_achievements_stageId_fkey" 
            FOREIGN KEY ("stageId") REFERENCES "goal_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE
          `;

          // Добавляем индексы
          await prisma.$executeRaw`CREATE INDEX "user_goals_goalTypeId_idx" ON "user_goals"("goalTypeId")`;
          await prisma.$executeRaw`CREATE INDEX "goal_stages_goalId_idx" ON "goal_stages"("goalId")`;
          await prisma.$executeRaw`CREATE INDEX "user_goal_achievements_userId_idx" ON "user_goal_achievements"("userId")`;
          await prisma.$executeRaw`CREATE INDEX "user_goal_achievements_goalId_idx" ON "user_goal_achievements"("goalId")`;
          await prisma.$executeRaw`CREATE INDEX "user_goal_achievements_stageId_idx" ON "user_goal_achievements"("stageId")`;

          // Добавляем уникальные ограничения
          await prisma.$executeRaw`
            ALTER TABLE "goal_stages" 
            ADD CONSTRAINT "goal_stages_goalId_stage_key" 
            UNIQUE ("goalId", "stage")
          `;

          await prisma.$executeRaw`
            ALTER TABLE "user_goal_achievements" 
            ADD CONSTRAINT "user_goal_achievements_userId_stageId_period_key" 
            UNIQUE ("userId", "stageId", "period")
          `;

          results.push('Created goals system tables: goal_types, user_goals, goal_stages, user_goal_achievements');
        }

        return NextResponse.json({
          success: true,
          message: `Применены миграции: ${results.join(', ')}`,
          appliedChanges: results
        });

      } catch (migrationError) {
        console.error("Ошибка применения миграций:", migrationError);
        return NextResponse.json({
          error: "Ошибка применения миграций",
          details: migrationError instanceof Error ? migrationError.message : "Неизвестная ошибка",
          partialResults: results
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      error: "Неизвестное действие миграции"
    }, { status: 400 });

  
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка применения полной миграции:", error);
    return NextResponse.json(
      { 
        error: "Ошибка применения полной миграции", 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
