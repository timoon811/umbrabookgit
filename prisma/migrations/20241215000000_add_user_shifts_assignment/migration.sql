-- Создание таблицы для назначения смен пользователям
CREATE TABLE "user_shift_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shiftSettingId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_shift_assignments_pkey" PRIMARY KEY ("id")
);

-- Индексы для быстрого поиска
CREATE INDEX "user_shift_assignments_userId_idx" ON "user_shift_assignments"("userId");
CREATE INDEX "user_shift_assignments_shiftSettingId_idx" ON "user_shift_assignments"("shiftSettingId");
CREATE UNIQUE INDEX "user_shift_assignments_userId_shiftSettingId_key" ON "user_shift_assignments"("userId", "shiftSettingId");

-- Внешние ключи
ALTER TABLE "user_shift_assignments" ADD CONSTRAINT "user_shift_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_shift_assignments" ADD CONSTRAINT "user_shift_assignments_shiftSettingId_fkey" FOREIGN KEY ("shiftSettingId") REFERENCES "shift_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_shift_assignments" ADD CONSTRAINT "user_shift_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
