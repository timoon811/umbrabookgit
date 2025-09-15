const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createGoalsTables() {
  try {
    console.log('🎯 СОЗДАНИЕ ТАБЛИЦ СИСТЕМЫ ПЛАНОВ\n');

    // Создаем таблицы через raw SQL
    console.log('📋 Создаем таблицы...');

    // Таблица типов целей
    await prisma.$executeRaw`
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
      );
    `;

    // Таблица планов/целей
    await prisma.$executeRaw`
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
      );
    `;

    // Таблица этапов планов
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "goal_stages" (
        "id" TEXT NOT NULL,
        "goalId" TEXT NOT NULL,
        "stage" INTEGER NOT NULL,
        "targetValue" DECIMAL(10,2) NOT NULL,
        "rewardAmount" DECIMAL(10,2) NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "goal_stages_pkey" PRIMARY KEY ("id")
      );
    `;

    // Таблица достижений
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "user_goal_achievements" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "goalId" TEXT NOT NULL,
        "stageId" TEXT NOT NULL,
        "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "achievedValue" DECIMAL(10,2) NOT NULL,
        "rewardAmount" DECIMAL(10,2) NOT NULL,
        "period" TEXT NOT NULL,
        "isRewarded" BOOLEAN NOT NULL DEFAULT false,
        "rewardedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "user_goal_achievements_pkey" PRIMARY KEY ("id")
      );
    `;

    console.log('✅ Таблицы созданы');

    // Добавляем внешние ключи если их нет
    console.log('🔗 Добавляем внешние ключи...');

    try {
      await prisma.$executeRaw`
        ALTER TABLE "user_goals" 
        ADD CONSTRAINT "user_goals_goalTypeId_fkey" 
        FOREIGN KEY ("goalTypeId") REFERENCES "goal_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      `;
    } catch (e) {
      // Уже существует
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "goal_stages" 
        ADD CONSTRAINT "goal_stages_goalId_fkey" 
        FOREIGN KEY ("goalId") REFERENCES "user_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (e) {
      // Уже существует
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "user_goal_achievements" 
        ADD CONSTRAINT "user_goal_achievements_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (e) {
      // Уже существует
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "user_goal_achievements" 
        ADD CONSTRAINT "user_goal_achievements_goalId_fkey" 
        FOREIGN KEY ("goalId") REFERENCES "user_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (e) {
      // Уже существует
    }

    try {
      await prisma.$executeRaw`
        ALTER TABLE "user_goal_achievements" 
        ADD CONSTRAINT "user_goal_achievements_stageId_fkey" 
        FOREIGN KEY ("stageId") REFERENCES "goal_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;
    } catch (e) {
      // Уже существует
    }

    console.log('✅ Внешние ключи добавлены');

    // Создаем индексы
    console.log('📇 Создаем индексы...');

    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "goal_stages_goalId_stage_idx" ON "goal_stages"("goalId", "stage");
      `;
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "user_goal_achievements_userId_period_idx" ON "user_goal_achievements"("userId", "period");
      `;
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "goal_stages_goalId_stage_key" ON "goal_stages"("goalId", "stage");
      `;
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "user_goal_achievements_userId_stageId_period_key" ON "user_goal_achievements"("userId", "stageId", "period");
      `;
    } catch (e) {
      // Уже существуют
    }

    console.log('✅ Индексы созданы');

    console.log('\n🎯 Структура таблиц создана успешно!');
    console.log('\n📋 Создание базовых типов планов...');

    // Создаем базовые типы планов
    const goalTypes = [
      {
        id: 'earnings-goal',
        name: 'План на заработок',
        description: 'Цели по заработанной сумме',
        unit: '$',
        type: 'EARNINGS'
      },
      {
        id: 'deposits-goal',
        name: 'План на количество депозитов',
        description: 'Цели по количеству обработанных депозитов',
        unit: 'шт',
        type: 'DEPOSITS_COUNT'
      },
      {
        id: 'hours-goal',
        name: 'План на отработанные часы',
        description: 'Цели по количеству отработанных часов',
        unit: 'ч',
        type: 'HOURS'
      }
    ];

    for (const goalType of goalTypes) {
      await prisma.$executeRaw`
        INSERT INTO "goal_types" ("id", "name", "description", "unit", "type", "isActive", "createdAt", "updatedAt")
        VALUES (${goalType.id}, ${goalType.name}, ${goalType.description}, ${goalType.unit}, ${goalType.type}, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("id") DO NOTHING;
      `;
      console.log(`   ✅ ${goalType.name} (${goalType.unit})`);
    }

    console.log('\n🎉 СИСТЕМА ПЛАНОВ ГОТОВА К ИСПОЛЬЗОВАНИЮ!');

  } catch (error) {
    console.error('❌ Ошибка создания таблиц:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createGoalsTables();
