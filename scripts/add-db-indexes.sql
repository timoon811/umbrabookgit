-- Скрипт добавления недостающих индексов для оптимизации производительности
-- Основан на анализе audit/02_db/findings.md

-- Составные индексы для частых запросов

-- 1. Buyer daily logs - поиск по покупателю и дате
CREATE INDEX IF NOT EXISTS buyer_daily_logs_buyer_date_idx 
ON buyer_daily_logs(buyerId, date);

-- 2. Processor deposits - поиск по процессору и статусу  
CREATE INDEX IF NOT EXISTS processor_deposits_processor_status_idx 
ON processor_deposits(processorId, status);

-- 3. Salary earnings log - поиск по процессору и периоду
CREATE INDEX IF NOT EXISTS salary_earnings_log_processor_period_idx 
ON salary_earnings_log(processorId, period);

-- 4. User shifts - поиск по пользователю и дате
CREATE INDEX IF NOT EXISTS user_shifts_user_date_idx 
ON user_shifts(userId, startTime);

-- 5. Buyer projects - поиск по покупателю и статусу
CREATE INDEX IF NOT EXISTS buyer_projects_buyer_status_idx 
ON buyer_projects(buyerId, status);

-- 6. Finance transactions - поиск по дате и типу
CREATE INDEX IF NOT EXISTS finance_transactions_date_type_idx 
ON finance_transactions(occurredAt, type);

-- 7. Bonus grid - поиск по роли и уровню
CREATE INDEX IF NOT EXISTS bonus_grid_role_level_idx 
ON bonus_grid(role, level);

-- 8. Shift assignments - поиск по assignedBy и дате
CREATE INDEX IF NOT EXISTS user_shift_assignments_assigned_date_idx 
ON user_shift_assignments(assignedBy, assignedAt);

-- 9. Buyer requests - поиск по покупателю и статусу
CREATE INDEX IF NOT EXISTS buyer_requests_buyer_status_idx 
ON buyer_requests(buyerId, status);

-- 10. Content projects - поиск по типу и активности
CREATE INDEX IF NOT EXISTS content_projects_type_active_idx 
ON content_projects(type, "isActive");

-- Частичные индексы для особых случаев

-- 11. Активные пользователи
CREATE INDEX IF NOT EXISTS users_active_idx 
ON users(role, status) 
WHERE status = 'APPROVED';

-- 12. Не удаленные документы
CREATE INDEX IF NOT EXISTS documentation_published_idx 
ON documentation("isPublished", "updatedAt") 
WHERE "isPublished" = true;

-- 13. Недавние депозиты (последние 30 дней)
CREATE INDEX IF NOT EXISTS processor_deposits_recent_idx 
ON processor_deposits("createdAt", status) 
WHERE "createdAt" > (NOW() - INTERVAL '30 days');

-- Индексы для внешних ключей (если отсутствуют)

-- 14. Проверяем и добавляем индексы для FK
CREATE INDEX IF NOT EXISTS idx_buyer_daily_logs_buyer_id 
ON buyer_daily_logs(buyerId);

CREATE INDEX IF NOT EXISTS idx_salary_earnings_log_processor_id 
ON salary_earnings_log(processorId);

CREATE INDEX IF NOT EXISTS idx_user_shifts_user_id 
ON user_shifts(userId);

CREATE INDEX IF NOT EXISTS idx_documentation_section_id 
ON documentation(sectionId);

-- Индексы для текстового поиска

-- 15. Полнотекстовый поиск по документации
CREATE INDEX IF NOT EXISTS documentation_fulltext_idx 
ON documentation USING gin(to_tsvector('russian', title || ' ' || COALESCE(description, '')));

-- 16. Поиск по email пользователей (регистронезависимый)
CREATE INDEX IF NOT EXISTS users_email_lower_idx 
ON users(LOWER(email));

-- Анализ статистики после создания индексов
ANALYZE buyer_daily_logs;
ANALYZE processor_deposits;
ANALYZE salary_earnings_log;
ANALYZE user_shifts;
ANALYZE buyer_projects;
ANALYZE finance_transactions;
ANALYZE users;
ANALYZE documentation;
