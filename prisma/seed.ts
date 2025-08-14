import { PrismaClient, UserRole, UserStatus, ArticleStatus, HttpMethod, FeedbackType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Начинаем заполнение базы данных...");

  // Создаем администратора (или находим существующего)
  const adminPassword = await bcrypt.hash("umbra2024", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@umbra-platform.dev" },
    update: {},
    create: {
      email: "admin@umbra-platform.dev",
      name: "Umbra Platform Admin",
      password: adminPassword,
      role: UserRole.ADMIN,
      status: UserStatus.APPROVED,
      apiKey: "umbra_admin_key_" + Math.random().toString(36).substring(2, 15),
    },
  });

  console.log("✅ Администратор готов:", admin.email);

  // Создаем пользователя с ролью USER
  const userPassword = await bcrypt.hash("user123", 10);
  const user = await prisma.user.upsert({
    where: { email: "user@umbra-platform.dev" },
    update: {},
    create: {
      email: "user@umbra-platform.dev",
      name: "Regular User",
      password: userPassword,
      role: UserRole.USER,
      status: UserStatus.APPROVED,
      apiKey: "umbra_user_key_" + Math.random().toString(36).substring(2, 15),
    },
  });
  console.log("✅ Пользователь готов:", user.email);

  // Создаем медиа байера
  const mediaBuyerPassword = await bcrypt.hash("buyer123", 10);
  const mediaBuyer = await prisma.user.upsert({
    where: { email: "mediabuyer@umbra-platform.dev" },
    update: {},
    create: {
      email: "mediabuyer@umbra-platform.dev",
      name: "Media Buyer",
      password: mediaBuyerPassword,
      role: UserRole.MEDIA_BUYER,
      status: UserStatus.APPROVED,
      apiKey: "umbra_buyer_key_" + Math.random().toString(36).substring(2, 15),
    },
  });
  console.log("✅ Медиа байер готов:", mediaBuyer.email);

  // Создаем категории
  const categories = [
    {
      key: "getting-started",
      name: "НАЧАЛО РАБОТЫ",
      description: "Основы работы с платформой и первые шаги",
      order: 1,
    },
    {
      key: "api",
      name: "API REFERENCE V2",
      description: "Документация по API версии 2",
      order: 2,
    },
    {
      key: "cms-modules",
      name: "МОДУЛИ ДЛЯ CMS",
      description: "Интеграция с различными CMS системами",
      order: 3,
    },
    {
      key: "forms-buttons",
      name: "ФОРМЫ И КНОПКИ",
      description: "Создание и настройка форм и кнопок",
      order: 4,
    },
  ];

  for (const categoryData of categories) {
    await prisma.category.upsert({
      where: { key: categoryData.key },
      update: categoryData,
      create: categoryData,
    });
  }

  console.log("✅ Категории созданы");

  // Создаем саппорт
  const supportPassword = await bcrypt.hash("support123", 10);
  const support = await prisma.user.upsert({
    where: { email: "support@umbra-platform.dev" },
    update: {},
    create: {
      email: "support@umbra-platform.dev",
      name: "Support Agent",
      password: supportPassword,
      role: UserRole.SUPPORT,
      status: UserStatus.APPROVED,
      apiKey: "umbra_support_key_" + Math.random().toString(36).substring(2, 15),
    },
  });
  console.log("✅ Саппорт готов:", support.email);

  // Создаем статьи документации
  const articles = [
    // НАЧАЛО РАБОТЫ
    {
      title: "Обзор документации",
      slug: "overview",
      content: `# Обзор документации

Добро пожаловать в документацию CryptoCloud API! 🚀

Цель этой документации — проиллюстрировать, как интегрировать любой проект с CryptoCloud и начать принимать платежи в криптовалюте.

## О сервисе

CryptoCloud — это платежный шлюз, который позволяет удобно принимать и обрабатывать платежи в популярных криптовалютах. С помощью нашего крипто эквайринга вы можете подключить прием криптовалютных платежей к онлайн-сервису, интернет-магазину, онлайн-школе, Telegram-боту и другим платформам.

## Основные возможности API

- **Управление счетами:** создавайте, управляйте и мониторьте состояние ваших счетов в реальном времени.
- **Автоматизация транзакций:** настройка автоматических платежей и переводов между счетами.
- **Безопасность и прозрачность:** высокий уровень безопасности при проведении транзакций и полная прозрачность всех операций.
- **Webhook-уведомления:** получайте мгновенные уведомления о статусе платежей.
- **Множественные валюты:** поддержка Bitcoin, Ethereum, USDT и других популярных криптовалют.

## Поддерживаемые криптовалюты

| Валюта | Сеть | Комиссия |
|--------|------|----------|
| Bitcoin | BTC | 0.5% |
| Ethereum | ETH | 0.5% |
| USDT | TRC20, ERC20 | 0.5% |
| Litecoin | LTC | 0.5% |
| USDC | ERC20 | 0.5% |`,
      excerpt: "Основная информация о CryptoCloud API и его возможностях",
      status: ArticleStatus.PUBLISHED,
      categoryKey: "getting-started",
      tags: JSON.stringify(["api", "обзор", "начало"]),
      metaTitle: "Обзор CryptoCloud API - Документация",
      metaDescription: "Узнайте основы работы с CryptoCloud API для приема криптовалютных платежей",
      authorId: admin.id,
      viewCount: 1250,
    },
    {
      title: "Быстрый старт",
      slug: "quick-start",
      content: `# Быстрый старт

Начните принимать криптовалютные платежи за 5 минут! ⚡

## Шаг 1: Регистрация

1. Зарегистрируйтесь на [cryptocloud.plus](https://cryptocloud.plus)
2. Подтвердите email адрес
3. Пройдите верификацию

## Шаг 2: Получение API ключа

1. Войдите в личный кабинет
2. Перейдите в раздел "API"
3. Создайте новый API ключ
4. Сохраните ключ в безопасном месте

## Шаг 3: Первый запрос

\`\`\`bash
curl -X POST https://api.cryptocloud.plus/v2/invoice/create \\
  -H "Authorization: Token YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10,
    "currency": "USD",
    "order_id": "test_order_1"
  }'
\`\`\`

## Пример ответа

\`\`\`json
{
  "status": "success",
  "result": {
    "uuid": "d24a5a94-8604-4d8e-b6e3-2b5e6f7a8b9c",
    "link": "https://pay.cryptocloud.plus/d24a5a94",
    "amount": 10,
    "currency": "USD",
    "status": "created"
  }
}
\`\`\`

🎉 Готово! Теперь вы можете принимать криптовалютные платежи.`,
      excerpt: "Пошаговое руководство по началу работы с CryptoCloud",
      status: ArticleStatus.PUBLISHED,
      categoryKey: "getting-started",
      tags: JSON.stringify(["быстрый старт", "регистрация", "первые шаги"]),
      metaTitle: "Быстрый старт - CryptoCloud API",
      metaDescription: "Начните принимать криптоплатежи за 5 минут с CryptoCloud",
      authorId: admin.id,
      viewCount: 890,
    },
    {
      title: "Интеграция",
      slug: "integration",
      content: `# Интеграция с вашим проектом

Узнайте, как интегрировать CryptoCloud в ваш проект.

## Типы интеграции

### 1. REST API
Полнофункциональный REST API для всех операций.

### 2. Webhook-уведомления
Автоматические уведомления о изменении статуса платежей.

### 3. SDK библиотеки
Готовые библиотеки для популярных языков программирования.

## Готовые SDK

| Язык | Репозиторий | Установка |
|------|-------------|-----------|
| PHP | github.com/cryptocloud/php-sdk | \`composer install cryptocloud/sdk\` |
| Node.js | github.com/cryptocloud/node-sdk | \`npm install cryptocloud-sdk\` |
| Python | github.com/cryptocloud/python-sdk | \`pip install cryptocloud\` |
| Laravel | github.com/cryptocloud/laravel | \`composer install cryptocloud/laravel\` |

## Пример интеграции (PHP)

\`\`\`php
<?php
require_once 'vendor/autoload.php';

use CryptoCloud\\SDK\\Client;

$client = new Client('YOUR_API_KEY');

// Создание счета
$invoice = $client->createInvoice([
    'amount' => 100,
    'currency' => 'USD',
    'order_id' => 'order_12345'
]);

echo "Ссылка для оплаты: " . $invoice['link'];
?>
\`\`\`

## Webhook обработка

\`\`\`php
<?php
// webhook.php
$payload = file_get_contents('php://input');
$data = json_decode($payload, true);

if ($data['status'] === 'paid') {
    // Платеж прошел успешно
    $orderId = $data['order_id'];
    // Обновите статус заказа в вашей системе
}
?>
\`\`\``,
      excerpt: "Подробное руководство по интеграции CryptoCloud в ваш проект",
      status: ArticleStatus.PUBLISHED,
      categoryKey: "getting-started",
      tags: JSON.stringify(["интеграция", "sdk", "webhook"]),
      metaTitle: "Интеграция CryptoCloud - Документация",
      metaDescription: "Узнайте, как интегрировать CryptoCloud в ваш проект",
      authorId: admin.id,
      viewCount: 654,
    },
    {
      title: "Тестирование",
      slug: "testing",
      content: `# Тестирование интеграции

Протестируйте вашу интеграцию перед запуском в продакшен.

## Тестовый режим

CryptoCloud предоставляет полнофункциональный тестовый режим:

- Все API эндпоинты работают как в продакшене
- Используются тестовые адреса кошельков
- Реальные криптовалюты не списываются
- Можно тестировать все сценарии платежей

## Получение тестового API ключа

1. В личном кабинете переключитесь в "Тестовый режим"
2. Создайте тестовый API ключ
3. Ключ будет начинаться с \`test_\`

## Тестовые сценарии

### Успешный платеж
\`\`\`bash
curl -X POST https://api.cryptocloud.plus/v2/invoice/create \\
  -H "Authorization: Token test_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10,
    "currency": "USD",
    "test_scenario": "success"
  }'
\`\`\`

### Отклоненный платеж
\`\`\`bash
curl -X POST https://api.cryptocloud.plus/v2/invoice/create \\
  -H "Authorization: Token test_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10,
    "currency": "USD",
    "test_scenario": "failed"
  }'
\`\`\`

## Checklist тестирования

- [ ] Создание счета
- [ ] Получение информации о счете
- [ ] Webhook уведомления
- [ ] Обработка успешных платежей
- [ ] Обработка отклоненных платежей
- [ ] Timeout сценарии`,
      excerpt: "Как правильно протестировать интеграцию с CryptoCloud",
      status: ArticleStatus.PUBLISHED,
      categoryKey: "getting-started",
      tags: JSON.stringify(["тестирование", "test mode", "debugging"]),
      metaTitle: "Тестирование CryptoCloud интеграции",
      metaDescription: "Протестируйте интеграцию с CryptoCloud перед запуском",
      authorId: admin.id,
      viewCount: 423,
    },

    // API REFERENCE V2
    {
      title: "Авторизация запросов",
      slug: "auth",
      content: `# Авторизация запросов

Все запросы к API CryptoCloud должны содержать заголовок Authorization с вашим API ключом.

## Получение API ключа

API ключ можно получить в личном кабинете CryptoCloud в разделе "API".

## Формат заголовка

\`\`\`
Authorization: Token YOUR_API_KEY
\`\`\`

## Типы ключей

### Продакшен ключи
- Начинаются с \`cc_live_\`
- Используются для реальных платежей
- Требуют верификации аккаунта

### Тестовые ключи
- Начинаются с \`cc_test_\`
- Для тестирования интеграции
- Доступны сразу после регистрации

## Безопасность

⚠️ **Важно**: Никогда не передавайте API ключи на клиентскую сторону!

- Храните ключи в переменных окружения
- Используйте HTTPS для всех запросов
- Регулярно обновляйте ключи
- Мониторьте использование API

## Пример запроса

\`\`\`bash
curl -H "Authorization: Token cc_live_abc123..." \\
     -H "Content-Type: application/json" \\
     https://api.cryptocloud.plus/v2/balance
\`\`\`

## Коды ошибок авторизации

| Код | Описание |
|-----|----------|
| 401 | Отсутствует заголовок Authorization |
| 403 | Неверный API ключ |
| 429 | Превышен лимит запросов |`,
      excerpt: "Как правильно авторизовать запросы к CryptoCloud API",
      status: ArticleStatus.PUBLISHED,
      categoryKey: "api",
      tags: JSON.stringify(["авторизация", "api-ключи", "безопасность"]),
      metaTitle: "Авторизация API запросов - CryptoCloud",
      metaDescription: "Инструкция по авторизации запросов к CryptoCloud API",
      authorId: admin.id,
      viewCount: 1100,
    },
    {
      title: "Создание счета",
      slug: "invoice-create",
      content: `# Создание счета

Создание нового счета для приема криптовалютных платежей.

## HTTP запрос

\`\`\`http
POST https://api.cryptocloud.plus/v2/invoice/create
\`\`\`

## Параметры запроса

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| amount | number | Да | Сумма к оплате |
| currency | string | Да | Валюта счета (USD, EUR, RUB) |
| order_id | string | Нет | Идентификатор заказа в вашей системе |
| email | string | Нет | Email плательщика |
| description | string | Нет | Описание платежа |
| success_url | string | Нет | URL для перенаправления после успешной оплаты |
| fail_url | string | Нет | URL для перенаправления после неудачной оплаты |
| webhook_url | string | Нет | URL для webhook уведомлений |

## Пример запроса

\`\`\`bash
curl -X POST https://api.cryptocloud.plus/v2/invoice/create \\
  -H "Authorization: Token YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 100,
    "currency": "USD",
    "order_id": "order_12345",
    "email": "user@example.com",
    "description": "Покупка Premium подписки",
    "success_url": "https://mysite.com/success",
    "fail_url": "https://mysite.com/fail"
  }'
\`\`\`

## Пример ответа

\`\`\`json
{
  "status": "success",
  "result": {
    "uuid": "d24a5a94-8604-4d8e-b6e3-2b5e6f7a8b9c",
    "link": "https://pay.cryptocloud.plus/d24a5a94",
    "amount": 100,
    "currency": "USD",
    "order_id": "order_12345",
    "status": "created",
    "created_at": "2024-01-15T10:30:00Z",
    "expires_at": "2024-01-15T11:30:00Z"
  }
}
\`\`\`

## Статусы счета

| Статус | Описание |
|--------|----------|
| created | Счет создан, ожидает оплаты |
| pending | Обнаружена транзакция, ожидает подтверждений |
| paid | Платеж успешно завершен |
| failed | Платеж отклонен или время истекло |
| cancelled | Счет отменен |`,
      excerpt: "Как создать счет для приема криптовалютных платежей",
      status: ArticleStatus.PUBLISHED,
      categoryKey: "api",
      tags: JSON.stringify(["счета", "api", "платежи"]),
      metaTitle: "Создание счета - CryptoCloud API",
      metaDescription: "Инструкция по созданию счета через CryptoCloud API",
      authorId: admin.id,
      viewCount: 987,
    },
    {
      title: "Информация о счете",
      slug: "invoice-info",
      content: `# Получение информации о счете

Получите подробную информацию о созданном счете.

## HTTP запрос

\`\`\`http
GET https://api.cryptocloud.plus/v2/invoice/info
\`\`\`

## Параметры запроса

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| uuid | string | Да | UUID счета |

## Пример запроса

\`\`\`bash
curl -X GET "https://api.cryptocloud.plus/v2/invoice/info?uuid=d24a5a94-8604-4d8e-b6e3-2b5e6f7a8b9c" \\
  -H "Authorization: Token YOUR_API_KEY"
\`\`\`

## Пример ответа

\`\`\`json
{
  "status": "success",
  "result": {
    "uuid": "d24a5a94-8604-4d8e-b6e3-2b5e6f7a8b9c",
    "amount": 100,
    "currency": "USD",
    "order_id": "order_12345",
    "email": "user@example.com",
    "description": "Покупка Premium подписки",
    "status": "paid",
    "created_at": "2024-01-15T10:30:00Z",
    "paid_at": "2024-01-15T10:45:00Z",
    "crypto_amount": "0.00234567",
    "crypto_currency": "BTC",
    "network": "Bitcoin",
    "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "txid": "8a5b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    "confirmations": 6
  }
}
\`\`\`

## Поля ответа

| Поле | Описание |
|------|----------|
| uuid | Уникальный идентификатор счета |
| amount | Сумма в фиатной валюте |
| currency | Фиатная валюта |
| crypto_amount | Сумма в криптовалюте |
| crypto_currency | Тип криптовалюты |
| network | Блокчейн сеть |
| address | Адрес для оплаты |
| txid | Хеш транзакции (если оплачен) |
| confirmations | Количество подтверждений |`,
      excerpt: "Как получить информацию о созданном счете",
      status: ArticleStatus.PUBLISHED,
      categoryKey: "api",
      tags: JSON.stringify(["счета", "информация", "статус"]),
      metaTitle: "Информация о счете - CryptoCloud API",
      metaDescription: "Получение детальной информации о счете через API",
      authorId: admin.id,
      viewCount: 756,
    },

    // МОДУЛИ ДЛЯ CMS
    {
      title: "WordPress плагин",
      slug: "wordpress-plugin",
      content: `# WordPress плагин CryptoCloud

Готовый плагин для интеграции CryptoCloud с WordPress и WooCommerce.

## Установка

### Способ 1: Через админ панель
1. В админ панели WordPress перейдите в "Плагины" → "Добавить новый"
2. Найдите "CryptoCloud Payment Gateway"
3. Нажмите "Установить" и "Активировать"

### Способ 2: Ручная установка
1. Скачайте плагин с [github.com/cryptocloud/wordpress](https://github.com/cryptocloud/wordpress)
2. Загрузите папку в \`/wp-content/plugins/\`
3. Активируйте плагин в админ панели

## Настройка

1. Перейдите в "WooCommerce" → "Настройки" → "Платежи"
2. Найдите "CryptoCloud" и нажмите "Настроить"
3. Введите ваш API ключ
4. Настройте остальные параметры

## Основные настройки

| Параметр | Описание |
|----------|----------|
| API ключ | Ваш API ключ из личного кабинета |
| Тестовый режим | Включить для тестирования |
| Заголовок | Название способа оплаты |
| Описание | Описание для покупателей |
| Успешная оплата | URL после успешной оплаты |

## Shortcode для форм

Плагин предоставляет shortcode для создания форм оплаты:

\`\`\`
[cryptocloud_payment amount="100" currency="USD" description="Donation"]
\`\`\`

### Параметры shortcode

- \`amount\` - сумма платежа
- \`currency\` - валюта (USD, EUR, RUB)
- \`description\` - описание платежа
- \`button_text\` - текст кнопки (по умолчанию "Оплатить")

## Хуки для разработчиков

\`\`\`php
// Изменить параметры перед созданием счета
add_filter('cryptocloud_invoice_params', function($params) {
    $params['custom_field'] = 'custom_value';
    return $params;
});

// Обработка успешного платежа
add_action('cryptocloud_payment_completed', function($order_id, $invoice_data) {
    // Ваш код
});
\`\`\`

## Требования

- WordPress 5.0+
- WooCommerce 3.0+
- PHP 7.4+
- SSL сертификат`,
      excerpt: "Официальный WordPress плагин для приема криптоплатежей",
      status: ArticleStatus.PUBLISHED,
      categoryKey: "cms-modules",
      tags: JSON.stringify(["wordpress", "woocommerce", "плагин"]),
      metaTitle: "WordPress плагин CryptoCloud",
      metaDescription: "Интеграция CryptoCloud с WordPress и WooCommerce",
      authorId: admin.id,
      viewCount: 2341,
    },
    {
      title: "Модуль для OpenCart",
      slug: "opencart-module",
      content: `# Модуль CryptoCloud для OpenCart

Готовый модуль оплаты для интернет-магазинов на OpenCart.

## Совместимость

- OpenCart 3.x
- OpenCart 4.x
- PHP 7.4+

## Установка

1. Скачайте модуль с [github.com/cryptocloud/opencart](https://github.com/cryptocloud/opencart)
2. В админ панели перейдите в "Расширения" → "Установщик"
3. Загрузите ZIP файл модуля
4. Перейдите в "Расширения" → "Оплата"
5. Найдите CryptoCloud и нажмите "Установить"

## Настройка модуля

1. После установки нажмите "Изменить"
2. Заполните настройки:

### Основные настройки

| Поле | Описание |
|------|----------|
| Статус | Включить/выключить модуль |
| API ключ | Ваш API ключ |
| Тестовый режим | Для тестирования интеграции |
| Порядок сортировки | Позиция среди способов оплаты |

### Настройки отображения

| Поле | Описание |
|------|----------|
| Название | Название способа оплаты |
| Описание | Текст для покупателей |
| Логотип | Загрузите логотип CryptoCloud |

### Статусы заказов

| Статус | Когда применяется |
|--------|------------------|
| Ожидание оплаты | Счет создан |
| Обработка | Платеж получен |
| Выполнен | Платеж подтвержден |
| Отменен | Платеж отклонен |

## Webhook настройка

1. В настройках модуля найдите "Webhook URL"
2. Скопируйте URL
3. В личном кабинете CryptoCloud добавьте этот URL в настройки webhook

Пример webhook URL:
\`\`\`
https://yourstore.com/index.php?route=extension/payment/cryptocloud/webhook
\`\`\`

## Поддерживаемые валюты

Модуль автоматически конвертирует валюту магазина в поддерживаемые CryptoCloud валюты:
- USD
- EUR  
- RUB

## Логирование

Включите логирование для отладки:
1. В настройках модуля включите "Лог"
2. Логи сохраняются в \`system/storage/logs/cryptocloud.log\`

## Мультиязычность

Модуль поддерживает множественные языки OpenCart:
- Русский
- Английский
- Добавьте свой язык в папке \`catalog/language/\``,
      excerpt: "Модуль оплаты CryptoCloud для OpenCart интернет-магазинов",
      status: ArticleStatus.PUBLISHED,
      categoryKey: "cms-modules",
      tags: JSON.stringify(["opencart", "модуль", "интернет-магазин"]),
      metaTitle: "OpenCart модуль CryptoCloud",
      metaDescription: "Прием криптоплатежей в OpenCart с CryptoCloud",
      authorId: admin.id,
      viewCount: 876,
    },

    // ФОРМЫ И КНОПКИ
    {
      title: "Кнопка оплаты",
      slug: "payment-button",
      content: `# Кнопка оплаты CryptoCloud

Готовая JavaScript кнопка для быстрой интеграции на любой сайт.

## Быстрая интеграция

Добавьте этот код на вашу страницу:

\`\`\`html
<script src="https://cdn.cryptocloud.plus/button.js"></script>
<div id="cryptocloud-button"></div>
<script>
CryptoCloudButton.create({
  container: '#cryptocloud-button',
  amount: 100,
  currency: 'USD',
  description: 'Покупка товара',
  apiKey: 'YOUR_API_KEY'
});
</script>
\`\`\`

## Параметры кнопки

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| container | string | Да | CSS селектор контейнера |
| amount | number | Да | Сумма платежа |
| currency | string | Да | Валюта (USD, EUR, RUB) |
| apiKey | string | Да | Ваш API ключ |
| description | string | Нет | Описание платежа |
| orderId | string | Нет | ID заказа в вашей системе |
| theme | string | Нет | Тема: 'light', 'dark' |
| size | string | Нет | Размер: 'small', 'medium', 'large' |
| language | string | Нет | Язык: 'ru', 'en' |

## Кастомизация

### Темы оформления

\`\`\`javascript
// Светлая тема (по умолчанию)
CryptoCloudButton.create({
  theme: 'light'
});

// Темная тема
CryptoCloudButton.create({
  theme: 'dark'
});
\`\`\`

### Размеры кнопки

\`\`\`javascript
// Маленькая
CryptoCloudButton.create({
  size: 'small'
});

// Средняя (по умолчанию)
CryptoCloudButton.create({
  size: 'medium'
});

// Большая
CryptoCloudButton.create({
  size: 'large'
});
\`\`\`

## События

Подпишитесь на события для обработки результатов:

\`\`\`javascript
const button = CryptoCloudButton.create({
  // параметры...
  onSuccess: function(invoice) {
    console.log('Платеж успешен:', invoice);
    // Перенаправьте пользователя или покажите сообщение
  },
  onError: function(error) {
    console.error('Ошибка платежа:', error);
    // Покажите сообщение об ошибке
  },
  onCancel: function() {
    console.log('Платеж отменен пользователем');
  }
});
\`\`\`

## CSS стилизация

Вы можете переопределить стили кнопки:

\`\`\`css
.cryptocloud-button {
  background: linear-gradient(45deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  transition: all 0.2s;
}

.cryptocloud-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}
\`\`\`

## Безопасность

⚠️ **Важно**: Для безопасности рекомендуется:
- Валидировать параметры на сервере
- Использовать webhook для проверки платежей
- Не полагаться только на клиентские события`,
      excerpt: "JavaScript кнопка оплаты для быстрой интеграции",
      status: ArticleStatus.PUBLISHED,
      categoryKey: "forms-buttons",
      tags: JSON.stringify(["javascript", "кнопка", "интеграция"]),
      metaTitle: "Кнопка оплаты CryptoCloud",
      metaDescription: "Быстрая интеграция кнопки оплаты CryptoCloud",
      authorId: admin.id,
      viewCount: 1432,
    },
    {
      title: "HTML формы",
      slug: "html-forms",
      content: `# HTML формы оплаты

Создавайте кастомные формы оплаты с полным контролем над дизайном.

## Простая форма

\`\`\`html
<form id="payment-form">
  <div class="form-group">
    <label>Сумма к оплате</label>
    <input type="number" id="amount" min="1" required>
  </div>
  
  <div class="form-group">
    <label>Валюта</label>
    <select id="currency" required>
      <option value="USD">USD</option>
      <option value="EUR">EUR</option>
      <option value="RUB">RUB</option>
    </select>
  </div>
  
  <div class="form-group">
    <label>Email (необязательно)</label>
    <input type="email" id="email">
  </div>
  
  <div class="form-group">
    <label>Описание</label>
    <textarea id="description" placeholder="За что платим?"></textarea>
  </div>
  
  <button type="submit">Оплатить криптовалютой</button>
</form>

<script>
document.getElementById('payment-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const formData = {
    amount: document.getElementById('amount').value,
    currency: document.getElementById('currency').value,
    email: document.getElementById('email').value,
    description: document.getElementById('description').value,
    order_id: 'order_' + Date.now()
  };
  
  try {
    const response = await fetch('https://api.cryptocloud.plus/v2/invoice/create', {
      method: 'POST',
      headers: {
        'Authorization': 'Token YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      // Перенаправляем на страницу оплаты
      window.location.href = result.result.link;
    } else {
      alert('Ошибка создания счета: ' + result.message);
    }
  } catch (error) {
    alert('Ошибка соединения: ' + error.message);
  }
});
</script>
\`\`\`

## Форма с выбором криптовалюты

\`\`\`html
<form id="crypto-form">
  <div class="form-row">
    <div class="form-group">
      <label>Сумма</label>
      <input type="number" id="amount" step="0.01" required>
    </div>
    <div class="form-group">
      <label>Валюта</label>
      <select id="currency" required>
        <option value="USD">USD ($)</option>
        <option value="EUR">EUR (€)</option>
        <option value="RUB">RUB (₽)</option>
      </select>
    </div>
  </div>
  
  <div class="form-group">
    <label>Предпочитаемая криптовалюта</label>
    <div class="crypto-options">
      <label class="crypto-option">
        <input type="radio" name="crypto" value="BTC">
        <img src="/images/btc.png" alt="Bitcoin">
        Bitcoin (BTC)
      </label>
      <label class="crypto-option">
        <input type="radio" name="crypto" value="ETH">
        <img src="/images/eth.png" alt="Ethereum">
        Ethereum (ETH)
      </label>
      <label class="crypto-option">
        <input type="radio" name="crypto" value="USDT">
        <img src="/images/usdt.png" alt="USDT">
        USDT
      </label>
    </div>
  </div>
  
  <button type="submit" class="pay-button">
    Перейти к оплате
  </button>
</form>
\`\`\`

## CSS стили

\`\`\`css
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #374151;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.crypto-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.crypto-option {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.crypto-option:hover {
  border-color: #6366f1;
}

.crypto-option input[type="radio"] {
  margin-right: 8px;
}

.crypto-option img {
  width: 24px;
  height: 24px;
  margin-right: 8px;
}

.pay-button {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.pay-button:hover {
  transform: translateY(-2px);
}
\`\`\`

## Валидация формы

\`\`\`javascript
function validateForm(formData) {
  const errors = [];
  
  if (!formData.amount || formData.amount <= 0) {
    errors.push('Сумма должна быть больше 0');
  }
  
  if (!formData.currency) {
    errors.push('Выберите валюту');
  }
  
  if (formData.email && !isValidEmail(formData.email)) {
    errors.push('Некорректный email адрес');
  }
  
  return errors;
}

function isValidEmail(email) {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
}
\`\`\``,
      excerpt: "Создание кастомных HTML форм для приема криптоплатежей",
      status: ArticleStatus.PUBLISHED,
      categoryKey: "forms-buttons",
      tags: JSON.stringify(["html", "формы", "кастомизация"]),
      metaTitle: "HTML формы оплаты CryptoCloud",
      metaDescription: "Создание кастомных форм оплаты с CryptoCloud API",
      authorId: admin.id,
      viewCount: 634,
    },
  ];

  for (const articleData of articles) {
    const article = await prisma.article.upsert({
      where: { slug: articleData.slug },
      update: {},
      create: articleData,
    });
    console.log("✅ Статья готова:", article.title);
  }

  // Создаем API эндпоинты
  const apiEndpoints = [
    {
      name: "Создание счета",
      method: HttpMethod.POST,
      path: "/v2/invoice/create",
      description: "Создание нового счета для приема платежей",
      parameters: JSON.stringify({
        amount: { type: "number", required: true, description: "Сумма к оплате" },
        currency: { type: "string", required: true, description: "Валюта (USD, EUR, RUB)" },
        order_id: { type: "string", required: false, description: "ID заказа" },
        email: { type: "string", required: false, description: "Email плательщика" },
        description: { type: "string", required: false, description: "Описание платежа" },
        success_url: { type: "string", required: false, description: "URL успешной оплаты" },
        fail_url: { type: "string", required: false, description: "URL неудачной оплаты" },
      }),
      responses: JSON.stringify({
        "200": {
          status: "success",
          result: {
            uuid: "d24a5a94-8604-4d8e-b6e3-2b5e6f7a8b9c",
            link: "https://pay.cryptocloud.plus/d24a5a94",
            amount: 100,
            currency: "USD",
            status: "created",
            created_at: "2024-01-15T10:30:00Z",
            expires_at: "2024-01-15T11:30:00Z"
          }
        }
      }),
      examples: JSON.stringify({
        request: {
          amount: 100,
          currency: "USD",
          order_id: "order_12345",
          email: "user@example.com",
          description: "Premium подписка"
        }
      }),
      version: "v2",
    },
    {
      name: "Информация о счете",
      method: HttpMethod.GET,
      path: "/v2/invoice/info",
      description: "Получение подробной информации о счете",
      parameters: JSON.stringify({
        uuid: { type: "string", required: true, description: "UUID счета" }
      }),
      responses: JSON.stringify({
        "200": {
          status: "success",
          result: {
            uuid: "d24a5a94-8604-4d8e-b6e3-2b5e6f7a8b9c",
            amount: 100,
            currency: "USD",
            status: "paid",
            crypto_amount: "0.00234567",
            crypto_currency: "BTC",
            network: "Bitcoin",
            address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
            txid: "8a5b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
          }
        }
      }),
      version: "v2",
    },
    {
      name: "Получение баланса",
      method: HttpMethod.GET,
      path: "/v2/balance",
      description: "Получение текущего баланса",
      parameters: JSON.stringify({}),
      responses: JSON.stringify({
        "200": {
          status: "success",
          result: {
            USD: 1250.50,
            EUR: 890.25,
            RUB: 75000.00,
            BTC: 0.05432,
            ETH: 1.234,
            USDT: 1200.00
          }
        }
      }),
      version: "v2",
    },
    {
      name: "Список счетов",
      method: HttpMethod.GET,
      path: "/v2/invoices",
      description: "Получение списка всех счетов",
      parameters: JSON.stringify({
        limit: { type: "number", required: false, description: "Количество записей (макс. 100)" },
        offset: { type: "number", required: false, description: "Смещение для пагинации" },
        status: { type: "string", required: false, description: "Фильтр по статусу" },
        date_from: { type: "string", required: false, description: "Дата начала (YYYY-MM-DD)" },
        date_to: { type: "string", required: false, description: "Дата окончания (YYYY-MM-DD)" },
      }),
      responses: JSON.stringify({
        "200": {
          status: "success",
          result: {
            invoices: [
              {
                uuid: "d24a5a94-8604-4d8e-b6e3-2b5e6f7a8b9c",
                amount: 100,
                currency: "USD",
                status: "paid",
                created_at: "2024-01-15T10:30:00Z"
              }
            ],
            total: 1,
            limit: 50,
            offset: 0
          }
        }
      }),
      version: "v2",
    },
    {
      name: "Курсы валют",
      method: HttpMethod.GET,
      path: "/v2/rates",
      description: "Получение актуальных курсов криптовалют",
      parameters: JSON.stringify({
        currency: { type: "string", required: false, description: "Фиат валюта (USD, EUR, RUB)" }
      }),
      responses: JSON.stringify({
        "200": {
          status: "success",
          result: {
            USD: {
              BTC: 42500.50,
              ETH: 2650.75,
              USDT: 1.00,
              LTC: 95.30
            }
          }
        }
      }),
      version: "v2",
    },
    {
      name: "Создание вывода",
      method: HttpMethod.POST,
      path: "/v2/withdrawal/create",
      description: "Создание запроса на вывод средств",
      parameters: JSON.stringify({
        currency: { type: "string", required: true, description: "Криптовалюта (BTC, ETH, USDT)" },
        amount: { type: "number", required: true, description: "Сумма к выводу" },
        address: { type: "string", required: true, description: "Адрес получателя" },
        network: { type: "string", required: false, description: "Сеть (для USDT: TRC20, ERC20)" }
      }),
      responses: JSON.stringify({
        "200": {
          status: "success",
          result: {
            id: "withdrawal_123",
            currency: "BTC",
            amount: 0.01,
            address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
            status: "pending",
            fee: 0.0001
          }
        }
      }),
      version: "v2",
    },
    {
      name: "Статистика",
      method: HttpMethod.GET,
      path: "/v2/statistics",
      description: "Получение статистики по платежам",
      parameters: JSON.stringify({
        period: { type: "string", required: false, description: "Период: day, week, month, year" },
        currency: { type: "string", required: false, description: "Фильтр по валюте" }
      }),
      responses: JSON.stringify({
        "200": {
          status: "success",
          result: {
            total_amount: 15420.50,
            total_count: 89,
            successful_payments: 85,
            failed_payments: 4,
            average_amount: 173.26
          }
        }
      }),
      version: "v2",
    },
    {
      name: "Webhook тест",
      method: HttpMethod.POST,
      path: "/v2/webhook/test",
      description: "Тестирование webhook URL",
      parameters: JSON.stringify({
        url: { type: "string", required: true, description: "URL для тестирования" }
      }),
      responses: JSON.stringify({
        "200": {
          status: "success",
          result: {
            url: "https://example.com/webhook",
            response_code: 200,
            response_time: 450,
            test_successful: true
          }
        }
      }),
      version: "v2",
    },
  ];

  for (const endpointData of apiEndpoints) {
    const endpoint = await prisma.apiEndpoint.upsert({
      where: {
        method_path_version: {
          method: endpointData.method,
          path: endpointData.path,
          version: endpointData.version || "v2",
        },
      },
      update: {},
      create: endpointData,
    });
    console.log("✅ API эндпоинт готов:", endpoint.name);
  }

  // Создаем настройки сайта
  const siteSettings = [
    { key: "site_title", value: "CryptoCloud API Documentation", type: "string" },
    { key: "site_description", value: "Документация по API для приема криптовалютных платежей", type: "string" },
    { key: "contact_email", value: "support@cryptocloud.plus", type: "string" },
    { key: "api_version", value: "v2", type: "string" },
    { key: "enable_comments", value: "true", type: "boolean" },
    { key: "enable_analytics", value: "true", type: "boolean" },
    { key: "max_articles_per_page", value: "10", type: "number" },
  ];

  for (const setting of siteSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting,
    });
  }

  console.log("✅ Созданы настройки сайта");

  // Создаем дополнительных пользователей для комментариев
  const commentUsers = [
    {
      email: "alex@example.com",
      name: "Алексей Петров",
      password: await bcrypt.hash("user123", 10),
      role: UserRole.USER,
      status: UserStatus.APPROVED,
      telegram: "@alex_petrov",
    },
    {
      email: "maria@example.com", 
      name: "Мария Иванова",
      password: await bcrypt.hash("user123", 10),
      role: UserRole.USER,
      status: UserStatus.APPROVED,
      telegram: "@maria_ivanova",
    },
    {
      email: "dmitry@example.com",
      name: "Дмитрий Сидоров", 
      password: await bcrypt.hash("user123", 10),
      role: UserRole.USER,
      status: UserStatus.PENDING,
      telegram: "@dmitry_sidorov",
    },
  ];

  const createdCommentUsers = [];
  for (const userData of commentUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        password: userData.password,
        role: userData.role,
        status: userData.status,
        telegram: userData.telegram,
      },
      create: userData,
    });
    createdCommentUsers.push(user);
  }

  // Создаем тестовые комментарии
  const comments = [
    {
      content: "Отличная документация! Очень помогла в интеграции.",
      status: "APPROVED",
      articleIndex: 0,
      authorIndex: 0,
    },
    {
      content: "Спасибо за подробные примеры кода. Все работает как описано.",
      status: "APPROVED",
      articleIndex: 0,
      authorIndex: 1,
    },
    {
      content: "Было бы здорово добавить больше примеров на Python.",
      status: "APPROVED",
      articleIndex: 1,
      authorIndex: 2,
    },
  ];

  // Получаем созданные статьи для привязки комментариев
  const createdArticles = await prisma.article.findMany();
  
  for (const comment of comments) {
    if (createdArticles[comment.articleIndex] && createdCommentUsers[comment.authorIndex]) {
      await prisma.comment.create({
        data: {
          content: comment.content,
          status: comment.status as any,
          articleId: createdArticles[comment.articleIndex].id,
          authorId: createdCommentUsers[comment.authorIndex].id,
        },
      });
    }
  }

  console.log("✅ Созданы тестовые комментарии");

  // Создаем отзывы
  const feedbacks = [
    {
      type: FeedbackType.HELPFUL,
      message: "API очень удобный в использовании!",
      rating: 5,
      articleId: createdArticles[0]?.id,
    },
    {
      type: FeedbackType.RATING, 
      message: "Добавьте поддержку GraphQL API",
      rating: 4,
      articleId: createdArticles[1]?.id,
    },
    {
      type: FeedbackType.NOT_HELPFUL,
      message: "Документация слишком сложная для новичков",
      rating: 2,
      articleId: createdArticles[2]?.id,
    },
  ];

  for (const feedback of feedbacks) {
    if (feedback.articleId) {
      await prisma.feedback.create({
        data: feedback,
      });
    }
  }

  console.log("✅ Созданы отзывы пользователей");

  // Создаем поисковые запросы
  const searchQueries = [
    { query: "создание счета", results: 5 },
    { query: "api ключи", results: 3 },
    { query: "webhook", results: 4 },
    { query: "wordpress", results: 2 },
    { query: "тестирование", results: 6 },
    { query: "баланс", results: 2 },
    { query: "курсы валют", results: 1 },
    { query: "интеграция", results: 8 },
  ];

  for (const sq of searchQueries) {
    const existingQuery = await prisma.searchQuery.findFirst({ where: { query: sq.query } });
    if (existingQuery) {
      await prisma.searchQuery.update({
        where: { id: existingQuery.id },
        data: { results: sq.results },
      });
    } else {
      await prisma.searchQuery.create({ data: sq });
    }
  }

  console.log("✅ Созданы поисковые запросы");

  // Создаем аналитические события
  const analyticsEvents = [
    { event: "page_view", data: JSON.stringify({ page: "/overview", referrer: "google.com" }) },
    { event: "page_view", data: JSON.stringify({ page: "/quick-start", referrer: "direct" }) },
    { event: "page_view", data: JSON.stringify({ page: "/api/auth", referrer: "docs.cryptocloud.plus" }) },
    { event: "search", data: JSON.stringify({ page: "/", query: "создание счета" }) },
    { event: "search", data: JSON.stringify({ page: "/", query: "webhook" }) },
    { event: "button_click", data: JSON.stringify({ page: "/", button: "theme_toggle" }) },
    { event: "api_docs_view", data: JSON.stringify({ page: "/api/invoice-create", endpoint: "POST /v2/invoice/create" }) },
  ];

  for (const event of analyticsEvents) {
    await prisma.analytics.create({
      data: event,
    });
  }

  console.log("✅ Созданы аналитические события");

  console.log("🎉 База данных успешно заполнена!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Ошибка при заполнении БД:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
