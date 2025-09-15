/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Вход в систему
 *     description: Аутентификация пользователя с помощью email и пароля
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Успешная аутентификация
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Успешный вход в систему
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *         headers:
 *           Set-Cookie:
 *             description: JWT токен в cookie
 *             schema:
 *               type: string
 *               example: auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Ошибка валидации данных
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Неверные учетные данные
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Аккаунт заблокирован или не одобрен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Регистрация нового пользователя
 *     description: Создание новой учетной записи пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Регистрация прошла успешно
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Ошибка валидации данных
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Пользователь с таким email уже существует
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Выход из системы
 *     description: Удаление JWT токена из cookie
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Успешный выход из системы
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *         headers:
 *           Set-Cookie:
 *             description: Удаление auth-token cookie
 *             schema:
 *               type: string
 *               example: auth-token=; Max-Age=0
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Получение информации о текущем пользователе
 *     description: Возвращает данные авторизованного пользователя
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Информация о пользователе
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Пользователь не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /user:
 *   get:
 *     tags: [Users]
 *     summary: Получение полной информации о пользователе
 *     description: Возвращает расширенную информацию о текущем пользователе
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Полная информация о пользователе
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/User'
 *                 - type: object
 *                   properties:
 *                     wallets:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Wallet'
 *                     processor_deposits:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Deposit'
 *       401:
 *         description: Пользователь не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     tags: [Users]
 *     summary: Обновление профиля пользователя
 *     description: Изменение имени и/или email пользователя
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Профиль успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Ошибка валидации данных
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email уже используется
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /manager/deposits:
 *   get:
 *     tags: [Deposits]
 *     summary: Получение списка депозитов
 *     description: Возвращает список депозитов для менеджера или админа
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Номер страницы
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Количество элементов на странице
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, PROCESSING, all]
 *         description: Фильтр по статусу
 *     responses:
 *       200:
 *         description: Список депозитов с пагинацией
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deposits:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Deposit'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       401:
 *         description: Пользователь не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Недостаточно прав доступа
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags: [Deposits]
 *     summary: Создание нового депозита
 *     description: Добавление нового депозита менеджером
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DepositRequest'
 *     responses:
 *       201:
 *         description: Депозит успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Deposit'
 *       400:
 *         description: Ошибка валидации данных
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Недостаточно прав доступа
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /manager/stats:
 *   get:
 *     tags: [Deposits]
 *     summary: Получение статистики по депозитам
 *     description: Возвращает статистику депозитов для менеджера
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Статистика депозитов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 today:
 *                   type: object
 *                   properties:
 *                     totalAmount:
 *                       type: number
 *                     totalBonusAmount:
 *                       type: number
 *                     count:
 *                       type: integer
 *                 week:
 *                   type: object
 *                   properties:
 *                     totalAmount:
 *                       type: number
 *                     totalBonusAmount:
 *                       type: number
 *                     count:
 *                       type: integer
 *                 month:
 *                   type: object
 *                   properties:
 *                     totalAmount:
 *                       type: number
 *                     totalBonusAmount:
 *                       type: number
 *                     count:
 *                       type: integer
 *       401:
 *         description: Пользователь не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Недостаточно прав доступа
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Получение списка пользователей (только для админов)
 *     description: Возвращает список всех пользователей с фильтрацией
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Фильтр по статусу
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, USER, PROCESSOR, MODERATOR, MEDIA_BUYER, SUPPORT]
 *         description: Фильтр по роли
 *     responses:
 *       200:
 *         description: Список пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Пользователь не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Недостаточно прав доступа (только для админов)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /courses:
 *   get:
 *     tags: [Courses]
 *     summary: Получение списка опубликованных курсов
 *     description: Возвращает все опубликованные курсы
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Список курсов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 courses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       category:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       sections:
 *                         type: array
 *                         items:
 *                           type: object
 *       401:
 *         description: Пользователь не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /documentation:
 *   get:
 *     tags: [Documentation]
 *     summary: Получение списка документации
 *     description: Возвращает всю опубликованную документацию (публичный доступ)
 *     responses:
 *       200:
 *         description: Список документации
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 documentation:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       sectionId:
 *                         type: string
 *                       order:
 *                         type: integer
 *                       isPublished:
 *                         type: boolean
 *                 sections:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     sections:
 *                       type: integer
 *                     recent:
 *                       type: integer
 */
