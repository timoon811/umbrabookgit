import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Umbra Platform API',
      version: '1.0.0',
      description: 'API документация для платформы Umbra',
      contact: {
        name: 'API Support',
        email: 'support@umbra.com',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://umbra-platform.onrender.com/api'
          : 'http://localhost:3000/api',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'auth-token',
          description: 'JWT токен авторизации в cookie',
        },
      },
      schemas: {
        // Схемы для аутентификации
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email пользователя',
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'Пароль пользователя',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'confirmPassword', 'telegram'],
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              description: 'Имя пользователя',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email пользователя',
            },
            password: {
              type: 'string',
              minLength: 6,
              pattern: '(?=.*[a-zA-Z])(?=.*\\d)',
              description: 'Пароль (должен содержать буквы и цифры)',
            },
            confirmPassword: {
              type: 'string',
              description: 'Подтверждение пароля',
            },
            telegram: {
              type: 'string',
              pattern: '^@[a-zA-Z0-9_]{3,32}$',
              description: 'Telegram username (начинается с @)',
            },
          },
        },
        // Схемы для пользователей
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный ID пользователя',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email пользователя',
            },
            name: {
              type: 'string',
              description: 'Имя пользователя',
            },
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN', 'PROCESSOR', 'MEDIA_BUYER', 'ROP_PROCESSOR', 'ROP_BUYER', 'MODERATOR', 'SUPPORT'],
              description: 'Роль пользователя',
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'APPROVED', 'REJECTED'],
              description: 'Статус заявки пользователя',
            },
            isBlocked: {
              type: 'boolean',
              description: 'Заблокирован ли пользователь',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата последнего обновления',
            },
          },
        },
        // Схемы для депозитов
        DepositRequest: {
          type: 'object',
          required: ['amount', 'currency', 'playerEmail'],
          properties: {
            amount: {
              type: 'number',
              minimum: 0.01,
              description: 'Сумма депозита',
            },
            currency: {
              type: 'string',
              minLength: 3,
              maxLength: 10,
              description: 'Валюта депозита',
            },
            playerEmail: {
              type: 'string',
              format: 'email',
              description: 'Email игрока',
            },
            playerName: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              description: 'Имя игрока (необязательно)',
            },
            transactionId: {
              type: 'string',
              maxLength: 255,
              description: 'ID транзакции (необязательно)',
            },
            notes: {
              type: 'string',
              maxLength: 1000,
              description: 'Примечания (необязательно)',
            },
          },
        },
        Deposit: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный ID депозита',
            },
            amount: {
              type: 'number',
              description: 'Сумма депозита',
            },
            currency: {
              type: 'string',
              description: 'Валюта депозита',
            },
            bonusAmount: {
              type: 'number',
              description: 'Сумма бонуса',
            },
            playerEmail: {
              type: 'string',
              description: 'Email игрока',
            },
            playerName: {
              type: 'string',
              nullable: true,
              description: 'Имя игрока',
            },
            transactionId: {
              type: 'string',
              nullable: true,
              description: 'ID транзакции',
            },
            notes: {
              type: 'string',
              nullable: true,
              description: 'Примечания',
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSING'],
              description: 'Статус депозита',
            },
            processorId: {
              type: 'string',
              description: 'ID менеджера',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата обновления',
            },
          },
        },
        // Схемы для кошельков
        WalletRequest: {
          type: 'object',
          required: ['network', 'address'],
          properties: {
            network: {
              type: 'string',
              enum: ['BTC', 'ETH', 'USDT', 'LTC', 'XRP', 'ADA', 'DOT'],
              description: 'Сеть кошелька',
            },
            address: {
              type: 'string',
              minLength: 20,
              maxLength: 200,
              description: 'Адрес кошелька',
            },
            label: {
              type: 'string',
              maxLength: 100,
              description: 'Метка кошелька (необязательно)',
            },
          },
        },
        Wallet: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Уникальный ID кошелька',
            },
            network: {
              type: 'string',
              description: 'Сеть кошелька',
            },
            address: {
              type: 'string',
              description: 'Адрес кошелька',
            },
            label: {
              type: 'string',
              nullable: true,
              description: 'Метка кошелька',
            },
            userId: {
              type: 'string',
              description: 'ID владельца кошелька',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания',
            },
          },
        },
        // Общие схемы для ответов
        ErrorResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Сообщение об ошибке',
            },
            errors: {
              type: 'object',
              additionalProperties: {
                type: 'string',
              },
              description: 'Детали ошибок валидации',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Сообщение об успехе',
            },
          },
        },
        PaginationResponse: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Текущая страница',
            },
            limit: {
              type: 'integer',
              description: 'Количество элементов на странице',
            },
            total: {
              type: 'integer',
              description: 'Общее количество элементов',
            },
            pages: {
              type: 'integer',
              description: 'Общее количество страниц',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Операции аутентификации и авторизации',
      },
      {
        name: 'Users',
        description: 'Управление пользователями',
      },
      {
        name: 'Deposits',
        description: 'Управление депозитами',
      },
      {
        name: 'Wallets',
        description: 'Управление кошельками',
      },
      {
        name: 'Courses',
        description: 'Управление курсами',
      },
      {
        name: 'Documentation',
        description: 'Управление документацией',
      },
      {
        name: 'Admin',
        description: 'Административные операции',
      },
    ],
  },
  apis: [
    './src/app/api/**/*.ts', // Путь к файлам API routes
    './src/lib/swagger-docs.ts', // Дополнительные определения
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
