# Инструкция по предоставлению доступа к БД Render для AI ассистента

## Обзор

Чтобы AI ассистент мог полноценно работать с вашей базой данных на Render, необходимо предоставить ему соответствующие учетные данные и разрешения. Данная инструкция описывает безопасный способ предоставления доступа.

## 🔒 Важные меры безопасности

1. **Создайте отдельного пользователя для AI** - не используйте основные admin учетные данные
2. **Ограничьте права доступа** - предоставьте только необходимые права для чтения и анализа
3. **Используйте временные токены** - при возможности ограничьте время действия доступа
4. **Мониторьте активность** - отслеживайте действия AI в базе данных

## 📋 Пошаговая инструкция

### Шаг 1: Получение информации о БД на Render

1. Войдите в [Render Dashboard](https://dashboard.render.com)
2. Перейдите к вашей PostgreSQL БД (`umbra-platform-db-new`)
3. Во вкладке "Info" найдите:
   - **Host**: `dpg-d2p20s8dl3ps73eq28gg-a.frankfurt-postgres.render.com`
   - **Port**: `5432`
   - **Database**: `umbra_platform_db_new_km8e`
   - **Username**: `umbra_platform_db_new_km8e_user`

### Шаг 2: Получение пароля

1. В разделе "Info" нажмите на значок "глаза" рядом с паролем
2. Скопируйте **Password** (будет видно только при нажатии)

### Шаг 3: Настройка доступа для AI

#### Вариант A: Прямое подключение (рекомендуется для отладки)

Предоставьте AI следующую информацию:

```
Host: dpg-d2p20s8dl3ps73eq28gg-a.frankfurt-postgres.render.com
Port: 5432
Database: umbra_platform_db_new_km8e
Username: umbra_platform_db_new_km8e_user
Password: [ваш_пароль_из_render]
SSL Mode: require
```

#### Вариант B: Создание read-only пользователя (наиболее безопасный)

1. Подключитесь к БД как администратор:

```sql
-- Создаем read-only пользователя для AI
CREATE USER ai_assistant WITH PASSWORD 'secure_ai_password_123';

-- Предоставляем права на подключение к БД
GRANT CONNECT ON DATABASE umbra_platform_db_new_km8e TO ai_assistant;

-- Предоставляем права на использование схемы public
GRANT USAGE ON SCHEMA public TO ai_assistant;

-- Предоставляем права на чтение всех существующих таблиц
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ai_assistant;

-- Предоставляем права на чтение будущих таблиц
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ai_assistant;

-- Предоставляем права на использование sequences (для SERIAL полей)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO ai_assistant;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO ai_assistant;
```

2. Предоставьте AI данные read-only пользователя:

```
Host: dpg-d2p20s8dl3ps73eq28gg-a.frankfurt-postgres.render.com
Port: 5432
Database: umbra_platform_db_new_km8e
Username: ai_assistant
Password: secure_ai_password_123
SSL Mode: require
```

### Шаг 4: Формирование строки подключения

Для AI понадобится DATABASE_URL в формате:

```
postgresql://username:password@host:port/database?sslmode=require
```

**Пример для основного пользователя:**
```
postgresql://umbra_platform_db_new_km8e_user:YOUR_PASSWORD@dpg-d2p20s8dl3ps73eq28gg-a.frankfurt-postgres.render.com:5432/umbra_platform_db_new_km8e?sslmode=require
```

**Пример для read-only пользователя:**
```
postgresql://ai_assistant:secure_ai_password_123@dpg-d2p20s8dl3ps73eq28gg-a.frankfurt-postgres.render.com:5432/umbra_platform_db_new_km8e?sslmode=require
```

## 🛠 Настройка Render API доступа (для автоматизации)

### Получение API ключа Render

1. Перейдите в [Render Account Settings](https://dashboard.render.com/account)
2. В разделе "API Keys" создайте новый ключ
3. Сохраните сгенерированный API ключ

### Права доступа для AI через Render API

AI уже настроен для работы с Render MCP (Model Context Protocol), который позволяет:

- ✅ Просматривать список БД
- ✅ Выполнять read-only SQL запросы
- ✅ Анализировать структуру БД
- ✅ Получать метрики производительности
- ❌ Изменять структуру БД (безопасность)
- ❌ Удалять данные (безопасность)

## 🔍 Проверка доступа

### Тест подключения

Выполните тестовый запрос:

```sql
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
LIMIT 5;
```

### Проверка прав пользователя

```sql
-- Проверяем права текущего пользователя
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants 
WHERE grantee = current_user;
```

## 🚨 Отзыв доступа

Если необходимо отозвать доступ:

### Удаление read-only пользователя

```sql
-- Отзываем все права
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM ai_assistant;
REVOKE ALL PRIVILEGES ON SCHEMA public FROM ai_assistant;
REVOKE CONNECT ON DATABASE umbra_platform_db_new_km8e FROM ai_assistant;

-- Удаляем пользователя
DROP USER ai_assistant;
```

### Смена пароля основного пользователя

1. В Render Dashboard перейдите к вашей БД
2. Во вкладке "Settings" найдите "Reset Password"
3. Нажмите "Reset Password" для генерации нового пароля

## 📊 Мониторинг активности

### Просмотр активных подключений

```sql
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  query
FROM pg_stat_activity 
WHERE usename IN ('ai_assistant', 'umbra_platform_db_new_km8e_user');
```

### Логи в Render

1. В Render Dashboard перейдите к вашей БД
2. Во вкладке "Logs" можете отслеживать все подключения и запросы

## 🎯 Рекомендации

1. **Используйте Вариант B (read-only пользователь)** для максимальной безопасности
2. **Регулярно меняйте пароли** и мониторьте активность
3. **Используйте IP allowlist** в настройках Render БД при необходимости
4. **Создавайте бэкапы** перед предоставлением любого доступа
5. **Тестируйте подключение** перед передачей данных AI

## 📞 Поддержка

При возникновении проблем:

1. Проверьте статус БД в Render Dashboard
2. Убедитесь в правильности SSL настроек
3. Проверьте IP allowlist (если настроен)
4. Используйте страницу миграции в админ панели: `/admin/database`
5. Обратитесь к [документации Render](https://render.com/docs/databases)

## 🛠 Использование страницы миграции

После предоставления доступа, AI может использовать встроенную страницу миграции:

1. **Перейдите в админ панель**: `/admin/database`
2. **Доступные действия**:
   - **Перепроверить БД** - анализ текущего состояния
   - **Запустить полную миграцию** - применение всех недостающих элементов
   - **Создать таблицы Buyer системы** - создание специфичных таблиц
   - **Создать таблицы Processing системы** - создание таблиц обработки
   - **Индивидуальные действия** - создание отдельных таблиц/колонок

3. **Мониторинг**: Страница показывает статус всех таблиц и критических колонок

## 📊 Система проверки включает

- ✅ **Все основные таблицы** (users, courses, documentation, etc.)
- ✅ **Финансовые таблицы** (accounts, transactions, projects)
- ✅ **Процессорные таблицы** (deposits, shifts, salaries)
- ✅ **Buyer система** (projects, logs, requests, bonuses)
- ✅ **Система целей** (goals, achievements, stages)
- ✅ **Processing система** (instructions, scripts, templates)
- ✅ **Критические колонки** (assignedBuyerId, platformCommission, etc.)
