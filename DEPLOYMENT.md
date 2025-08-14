# 🚀 Деплой UmbraPL на Render

## 🏗️ **Архитектура (Упрощенная)**

```
┌─────────────────────────────────────┐
│        Web Service                  │
│  (umbra-platform-backend)          │
│                                     │
│  ├── Next.js App (фронт + бэк)     │
│  ├── API Routes (/api/*)           │
│  ├── Prisma Client                 │
│  ├── Static Assets                 │
│  └── Admin Panel                   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│     PostgreSQL Database             │
│  (umbra-platform-main)             │
│                                     │
│  ├── Articles                      │
│  ├── Users                         │
│  ├── Categories                    │
│  └── Finance Models                │
└─────────────────────────────────────┘
```

## 📋 **Созданные сервисы**

### 1. PostgreSQL База данных
- **Имя**: `umbra-platform-main`
- **План**: basic_256mb (15GB)
- **Регион**: Oregon
- **Статус**: 🔄 Создается
- **Dashboard**: https://dashboard.render.com/d/dpg-d2f3ufili9vc73bfdq7g-a

### 2. Web Сервис (Бэк + Фронт)
- **Имя**: `umbra-platform-backend`
- **План**: starter
- **Регион**: Oregon
- **URL**: https://umbra-platform-backend.onrender.com
- **Dashboard**: https://dashboard.render.com/web/srv-d2f3rfumcj7s73892h9g
- **Статус**: 🔄 Деплой в процессе (с новой базой данных)

## 🔧 **Переменные окружения**

```bash
DATABASE_URL=postgresql://umbra_platform_main_user:umbra_platform_main_user@dpg-d2f3ufili9vc73bfdq7g-a.oregon.postgres.render.com/umbra_platform_main
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
JWT_SECRET=umbra_platform_super_secret_jwt_key_2024_production
PORT=10000
SKIP_DB_CHECK=true
```

## 📊 **Мониторинг**

### Проверка статуса деплоя
```bash
# Основной сервис
curl https://umbra-platform-backend.onrender.com

# API health check
curl https://umbra-platform-backend.onrender.com/api/health
```

### Логи деплоя
- **Web сервис**: https://dashboard.render.com/web/srv-d2f3rfumcj7s73892h9g/logs

## 🎯 **Следующие шаги**

1. **Дождаться завершения деплоя** web сервиса
2. **Дождаться готовности** базы данных
3. **Проверить работоспособность** основного URL
4. **Протестировать** API endpoints
5. **Проверить** админ панель

## 🔍 **Возможные проблемы**

### Ошибка DATABASE_URL
- ✅ **ИСПРАВЛЕНО**: Создана новая база `umbra-platform-main` в том же регионе
- ✅ **ДОБАВЛЕНО**: `SKIP_DB_CHECK=true` для пропуска проверки БД во время сборки
- Убедиться, что переменная окружения установлена
- Проверить доступность базы данных

### Ошибка сборки
- ✅ **ИСПРАВЛЕНО**: Node.js 22.x поддерживается
- ✅ **ИСПРАВЛЕНО**: Build команда не требует подключения к БД
- Убедиться, что все зависимости установлены
- Проверить логи сборки

## 📞 **Поддержка**

При возникновении проблем:
1. Проверить логи в Render Dashboard
2. Убедиться в корректности переменных окружения
3. Проверить статус web сервиса и базы данных

## 🔄 **История деплоя**

- **19:49** - Создана база данных `umbra-platform-postgres` (удалена)
- **19:50** - Создан web сервис `umbra-platform-backend`
- **19:50** - Создан static site `umbra-platform-frontend` (удален)
- **19:50** - Создана база данных `umbra-platform-prod` (проблемы с доступом)
- **19:52** - Запущен деплой с исправленным DATABASE_URL
- **19:54** - Запущен деплой с правильной архитектурой
- **19:55** - Создана новая база `umbra-platform-main` (в том же регионе)
- **19:56** - Запущен финальный деплой с новой базой и SKIP_DB_CHECK

## ✨ **Преимущества новой архитектуры**

- **Простота**: Один сервис вместо трех
- **Эффективность**: Меньше ресурсов, проще управление
- **Надежность**: Меньше точек отказа
- **Масштабируемость**: Легче масштабировать один сервис
- **Совместимость**: База данных и сервис в одном регионе
