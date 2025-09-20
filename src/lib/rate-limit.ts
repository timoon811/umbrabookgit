import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Временное окно в миллисекундах
  maxRequests: number; // Максимальное количество запросов в окне
}

interface RateLimitData {
  count: number;
  resetTime: number;
}

// In-memory хранилище для rate limiting (в продакшене лучше использовать Redis)
const rateLimitStore = new Map<string, RateLimitData>();

// Конфигурации для разных endpoints
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000, // 15 минут
    maxRequests: 5, // 5 попыток входа за 15 минут
  },
  '/api/auth/register': {
    windowMs: 60 * 60 * 1000, // 1 час
    maxRequests: 3, // 3 регистрации с одного IP за час
  },
  '/api/user': {
    windowMs: 60 * 1000, // 1 минута
    maxRequests: 60, // 60 запросов к API пользователя в минуту
  },
  '/api/admin': {
    windowMs: 60 * 1000, // 1 минута
    maxRequests: 100, // 100 запросов к админ API в минуту
  },
  '/api/manager': {
    windowMs: 60 * 1000, // 1 минута
    maxRequests: 120, // 120 запросов к API процессора в минуту
  },
  'default': {
    windowMs: 60 * 1000, // 1 минута
    maxRequests: 200, // 200 запросов по умолчанию
  },
};

export function getRateLimitConfig(pathname: string): RateLimitConfig {
  // Ищем точное совпадение
  if (rateLimitConfigs[pathname]) {
    return rateLimitConfigs[pathname];
  }

  // Ищем совпадение по префиксу
  for (const [path, config] of Object.entries(rateLimitConfigs)) {
    if (pathname.startsWith(path)) {
      return config;
    }
  }

  return rateLimitConfigs.default;
}

export function getClientIP(request: NextRequest): string {
  // Получаем IP адрес клиента
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('x-vercel-forwarded-for');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (remoteAddr) {
    return remoteAddr;
  }
  
  return 'unknown';
}

export function checkRateLimit(
  request: NextRequest,
  pathname: string
): { allowed: boolean; remaining: number; resetTime: number } {
  const config = getRateLimitConfig(pathname);
  const clientIP = getClientIP(request);
  const key = `${clientIP}:${pathname}`;
  const now = Date.now();
  
  // Получаем данные для этого ключа
  let data = rateLimitStore.get(key);
  
  // Если данных нет или окно сброшено, создаем новые
  if (!data || now > data.resetTime) {
    data = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }
  
  // Увеличиваем счетчик
  data.count++;
  
  // Сохраняем обновленные данные
  rateLimitStore.set(key, data);
  
  // Очищаем старые записи (простая garbage collection)
  if (Math.random() < 0.01) { // 1% вероятность очистки
    cleanupExpiredEntries();
  }
  
  return {
    allowed: data.count <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - data.count),
    resetTime: data.resetTime,
  };
}

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

export function getRateLimitHeaders(
  allowed: boolean,
  remaining: number,
  resetTime: number,
  config: RateLimitConfig
): Record<string, string> {
  return {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
    ...(allowed ? {} : { 'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString() }),
  };
}
