-- Migration: Add Goals System for multi-stage achievement plans

-- Таблица типов целей (заработок, депозиты, часы)
CREATE TABLE "goal_types" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "unit" TEXT NOT NULL, -- '$', 'шт', 'ч'
  "type" TEXT NOT NULL, -- 'EARNINGS', 'DEPOSITS_COUNT', 'HOURS'
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "goal_types_pkey" PRIMARY KEY ("id")
);

-- Таблица планов/целей с многоэтапными наградами
CREATE TABLE "user_goals" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "goalTypeId" TEXT NOT NULL,
  "periodType" TEXT NOT NULL DEFAULT 'DAILY', -- 'DAILY', 'WEEKLY', 'MONTHLY'
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_goals_pkey" PRIMARY KEY ("id")
);

-- Таблица этапов плана (лесенка наград)
CREATE TABLE "goal_stages" (
  "id" TEXT NOT NULL,
  "goalId" TEXT NOT NULL,
  "stage" INTEGER NOT NULL, -- 1, 2, 3, 4...
  "targetValue" DECIMAL(10,2) NOT NULL, -- Целевое значение (100 депозитов, $500, 8 часов)
  "rewardAmount" DECIMAL(10,2) NOT NULL, -- Фиксированная награда в долларах
  "title" TEXT NOT NULL, -- "Первый рубеж", "Профессионал"
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "goal_stages_pkey" PRIMARY KEY ("id")
);

-- Таблица достижений пользователей
CREATE TABLE "user_goal_achievements" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "goalId" TEXT NOT NULL,
  "stageId" TEXT NOT NULL,
  "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "achievedValue" DECIMAL(10,2) NOT NULL, -- Достигнутое значение
  "rewardAmount" DECIMAL(10,2) NOT NULL, -- Полученная награда
  "period" TEXT NOT NULL, -- Период достижения (2025-09-15 для дневных)
  "isRewarded" BOOLEAN NOT NULL DEFAULT false, -- Выплачена ли награда
  "rewardedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_goal_achievements_pkey" PRIMARY KEY ("id")
);

-- Добавляем внешние ключи
ALTER TABLE "user_goals" ADD CONSTRAINT "user_goals_goalTypeId_fkey" FOREIGN KEY ("goalTypeId") REFERENCES "goal_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "goal_stages" ADD CONSTRAINT "goal_stages_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "user_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_goal_achievements" ADD CONSTRAINT "user_goal_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_goal_achievements" ADD CONSTRAINT "user_goal_achievements_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "user_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_goal_achievements" ADD CONSTRAINT "user_goal_achievements_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "goal_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Создаем индексы для производительности
CREATE INDEX "goal_stages_goalId_stage_idx" ON "goal_stages"("goalId", "stage");
CREATE INDEX "user_goal_achievements_userId_period_idx" ON "user_goal_achievements"("userId", "period");
CREATE INDEX "user_goal_achievements_goalId_period_idx" ON "user_goal_achievements"("goalId", "period");

-- Уникальные ограничения
CREATE UNIQUE INDEX "goal_stages_goalId_stage_key" ON "goal_stages"("goalId", "stage");
CREATE UNIQUE INDEX "user_goal_achievements_userId_stageId_period_key" ON "user_goal_achievements"("userId", "stageId", "period");
