import { prisma } from "@/lib/prisma";

export interface SystemHealthCheck {
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: any;
  timestamp: Date;
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'error';
  database: SystemHealthCheck;
  authentication: SystemHealthCheck;
  api: SystemHealthCheck;
  timestamp: Date;
}

// Проверка подключения к базе данных
export async function checkDatabaseHealth(): Promise<SystemHealthCheck> {
  try {
    // Простой запрос для проверки связи
    await prisma.$queryRaw`SELECT 1`;
    
    // Проверяем наличие основных таблиц
    const userCount = await prisma.users.count();
    
    return {
      status: 'healthy',
      message: 'База данных работает корректно',
      details: { userCount },
      timestamp: new Date()
    };
  } catch (error: any) {
    console.error('Database health check failed:', error);
    return {
      status: 'error',
      message: 'Ошибка подключения к базе данных',
      details: { error: error.message },
      timestamp: new Date()
    };
  }
}

// Проверка системы аутентификации
export async function checkAuthenticationHealth(): Promise<SystemHealthCheck> {
  try {
    // Проверяем JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return {
        status: 'error',
        message: 'JWT_SECRET не настроен',
        timestamp: new Date()
      };
    }

    if (jwtSecret.length < 32) {
      return {
        status: 'warning',
        message: 'JWT_SECRET слишком короткий (рекомендуется минимум 32 символа)',
        timestamp: new Date()
      };
    }

    return {
      status: 'healthy',
      message: 'Система аутентификации настроена корректно',
      timestamp: new Date()
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: 'Ошибка проверки системы аутентификации',
      details: { error: error.message },
      timestamp: new Date()
    };
  }
}

// Проверка API эндпоинтов
export async function checkApiHealth(): Promise<SystemHealthCheck> {
  try {
    // В продакшене можно добавить проверки внешних API
    const checks = [
      process.env.DATABASE_URL ? 'database_url' : null,
      process.env.JWT_SECRET ? 'jwt_secret' : null,
      process.env.NODE_ENV ? 'node_env' : null
    ].filter(Boolean);

    if (checks.length < 3) {
      return {
        status: 'warning',
        message: 'Не все переменные окружения настроены',
        details: { configuredChecks: checks },
        timestamp: new Date()
      };
    }

    return {
      status: 'healthy',
      message: 'API конфигурация в порядке',
      details: { configuredChecks: checks },
      timestamp: new Date()
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: 'Ошибка проверки API',
      details: { error: error.message },
      timestamp: new Date()
    };
  }
}

// Общая проверка здоровья системы
export async function getSystemHealth(): Promise<SystemHealth> {
  const [database, authentication, api] = await Promise.all([
    checkDatabaseHealth(),
    checkAuthenticationHealth(),
    checkApiHealth()
  ]);

  // Определяем общий статус
  let overall: 'healthy' | 'warning' | 'error' = 'healthy';
  
  if ([database, authentication, api].some(check => check.status === 'error')) {
    overall = 'error';
  } else if ([database, authentication, api].some(check => check.status === 'warning')) {
    overall = 'warning';
  }

  return {
    overall,
    database,
    authentication,
    api,
    timestamp: new Date()
  };
}

// Функция для логирования проблем
export function logSystemIssue(component: string, error: Error | string, context?: any) {
  const timestamp = new Date().toISOString();
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  console.error(`[SYSTEM] ${timestamp} - ${component}: ${errorMessage}`, context);
  
  // В будущем можно добавить отправку в систему мониторинга
}

// Быстрая проверка критических компонентов
export async function quickHealthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
  const issues: string[] = [];
  
  try {
    // Проверка базы данных
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    issues.push('База данных недоступна');
  }
  
  // Проверка JWT Secret
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    issues.push('JWT_SECRET не настроен или слишком слабый');
  }
  
  // Проверка DATABASE_URL
  if (!process.env.DATABASE_URL) {
    issues.push('DATABASE_URL не настроен');
  }
  
  return {
    healthy: issues.length === 0,
    issues
  };
}
