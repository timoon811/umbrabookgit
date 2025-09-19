-- CreateIndex
-- Добавляем UNIQUE ограничение для предотвращения дублирования смен
-- Пользователь не может иметь две смены на одну и ту же дату
CREATE UNIQUE INDEX "processor_shifts_processorId_shiftDate_key" ON "processor_shifts"("processorId", "shiftDate");
