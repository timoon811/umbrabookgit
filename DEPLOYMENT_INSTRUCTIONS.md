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
postgresql://umbra_platform_main_user:HgGzodbGxJHPk2Fo5tQw4pk5JEWUeyw4@dpg-d2f3ufili9vc73bfdq7g-a/umbra_platform_main
```

#### JWT_SECRET
```
umbra_platform_super_secret_jwt_key_2024
```

#### NODE_ENV
```
production
```

### Шаг 3: Перезапустите сервис
После настройки переменных окружения:
1. В Render Dashboard нажмите "Manual Deploy"
2. Выберите "Clear build cache & deploy"

### Шаг 4: Инициализируйте базу данных
После успешного деплоя выполните:
```bash
curl -X POST https://umbra-platform-backend.onrender.com/api/init-db
```

### Шаг 5: Проверьте авторизацию
Попробуйте войти с учетными данными:
- Email: admin@umbra-platform.dev
- Пароль: umbra2024

## Проверка
После настройки проверьте:
1. Сервис доступен: https://umbra-platform-backend.onrender.com
2. API работает: https://umbra-platform-backend.onrender.com/api/init-db
3. Авторизация работает: https://umbra-platform-backend.onrender.com/login

## Примечание
База данных `umbra-platform-main` уже настроена и готова к использованию.
Лишняя база данных `umbra-platform-db-new` может быть удалена.
