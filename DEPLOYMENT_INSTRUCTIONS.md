# Инструкция по настройке деплоя

## Проблема
Сервис успешно развернут, но не может подключиться к базе данных из-за отсутствия переменных окружения.

## Решение
Нужно настроить переменные окружения в Render Dashboard.

### Шаг 1: Откройте Render Dashboard
Перейдите на https://dashboard.render.com/web/srv-d2f3rfumcj7s73892h9g

### Шаг 2: Настройте переменные окружения
В разделе "Environment" добавьте следующие переменные:

#### DATABASE_URL
```
postgresql://umbra_platform_main_user:YOUR_PASSWORD@dpg-d2f3ufili9vc73bfdq7g-a.oregon-postgres.render.com/umbra_platform_main
```

**Замените `YOUR_PASSWORD` на пароль от базы данных.**

#### JWT_SECRET
```
umbra_platform_super_secret_jwt_key_2024
```

#### NODE_ENV
```
production
```

### Шаг 3: Получите пароль от базы данных
1. Перейдите на https://dashboard.render.com/d/dpg-d2f3ufili9vc73bfdq7g-a
2. В разделе "Connections" найдите "External Database URL"
3. Скопируйте пароль из URL

### Шаг 4: Перезапустите сервис
После настройки переменных окружения:
1. В Render Dashboard нажмите "Manual Deploy"
2. Выберите "Clear build cache & deploy"

### Шаг 5: Инициализируйте базу данных
После успешного деплоя выполните:
```bash
curl -X POST https://umbra-platform-backend.onrender.com/api/init-db
```

### Шаг 6: Проверьте авторизацию
Попробуйте войти с учетными данными:
- Email: admin@umbra-platform.dev
- Пароль: umbra2024

## Альтернативное решение
Если у вас есть доступ к базе данных, можете выполнить миграции вручную:

```bash
# Подключитесь к базе данных
psql "postgresql://umbra_platform_main_user:YOUR_PASSWORD@dpg-d2f3ufili9vc73bfdq7g-a.oregon-postgres.render.com/umbra_platform_main"

# Примените миграции
npx prisma migrate deploy

# Запустите seed
npm run db:seed
```

## Проверка
После настройки проверьте:
1. Сервис доступен: https://umbra-platform-backend.onrender.com
2. API работает: https://umbra-platform-backend.onrender.com/api/init-db
3. Авторизация работает: https://umbra-platform-backend.onrender.com/login
