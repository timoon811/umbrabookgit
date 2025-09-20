/**
 * УНИФИЦИРОВАННАЯ СИСТЕМА ВРЕМЕНИ ПЛАТФОРМЫ
 * 
 * Решает проблемы рассинхронизации времени между:
 * - Сервером (UTC)
 * - Клиентом (локальное время)
 * - Бизнес-логикой (UTC+3)
 * 
 * Все функции времени должны использовать эту систему!
 */

export interface UnifiedTime {
  utc: Date;        // Время в UTC (для базы данных)
  utc3: Date;       // Время в UTC+3 (для бизнес-логики)
  moscow: string;   // Строка в московском формате (для отображения)
  timestamp: number; // Unix timestamp (для API)
}

/**
 * ГЛАВНАЯ ФУНКЦИЯ - получение унифицированного времени
 * Всегда используй эту функцию вместо new Date()
 */
export function getUnifiedTime(): UnifiedTime {
  const now = new Date();
  const utc = new Date(now.getTime());
  const utc3 = new Date(now.getTime() + (3 * 60 * 60 * 1000));
  
  return {
    utc,
    utc3,
    moscow: utc3.toLocaleString('ru-RU', { 
      timeZone: 'Europe/Moscow',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    timestamp: now.getTime()
  };
}

/**
 * Конвертирует любую дату в унифицированный формат
 */
export function toUnifiedTime(date: Date | string | number): UnifiedTime {
  const baseDate = new Date(date);
  const utc = new Date(baseDate.getTime());
  const utc3 = new Date(baseDate.getTime() + (3 * 60 * 60 * 1000));
  
  return {
    utc,
    utc3,
    moscow: utc3.toLocaleString('ru-RU', { 
      timeZone: 'Europe/Moscow',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    timestamp: baseDate.getTime()
  };
}

/**
 * Проверка синхронизации времени
 */
export function validateTimeSync(): {
  isValid: boolean;
  serverTime: UnifiedTime;
  localOffset: number;
  recommendations: string[];
} {
  const unified = getUnifiedTime();
  const localDate = new Date();
  const localOffset = localDate.getTimezoneOffset();
  
  const recommendations: string[] = [];
  
  // Проверяем разницу UTC+3
  const expectedUtc3 = new Date(unified.utc.getTime() + (3 * 60 * 60 * 1000));
  const timeDiff = Math.abs(unified.utc3.getTime() - expectedUtc3.getTime());
  
  if (timeDiff > 1000) { // Больше 1 секунды разницы
    recommendations.push('Обнаружена рассинхронизация UTC+3 времени');
  }
  
  // Проверяем системное время
  if (Math.abs(localOffset + 180) > 5) { // Не московское время (учитываем погрешность)
    recommendations.push('Локальное время пользователя не соответствует UTC+3');
  }
  
  return {
    isValid: recommendations.length === 0,
    serverTime: unified,
    localOffset,
    recommendations
  };
}

/**
 * Форматирование времени для разных целей
 */
export const TimeFormatter = {
  // Для API ответов
  forAPI: (time: UnifiedTime) => ({
    utc: time.utc.toISOString(),
    utc3: time.utc3.toISOString().replace('Z', '+03:00'),
    timestamp: time.timestamp,
    moscow: time.moscow
  }),
  
  // Для логов
  forLogs: (time: UnifiedTime) => 
    `${time.moscow} (UTC+3) | ${time.utc.toISOString()} (UTC)`,
  
  // Для пользователя (краткий формат)
  forUser: (time: UnifiedTime) => 
    time.utc3.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    }),
  
  // Для пользователя (полный формат)
  forUserFull: (time: UnifiedTime) => time.moscow,
  
  // Для базы данных (всегда UTC)
  forDatabase: (time: UnifiedTime) => time.utc
};

/**
 * Работа с периодами времени
 */
export const TimePeriods = {
  // Начало дня по UTC+3 (06:00 UTC+3 = 03:00 UTC)
  getCurrentDayStart: (): UnifiedTime => {
    const unified = getUnifiedTime();
    const dayStart = new Date(unified.utc3);
    
    if (unified.utc3.getHours() < 6) {
      dayStart.setUTCDate(dayStart.getUTCDate() - 1);
    }
    
    dayStart.setHours(3, 0, 0, 0); // 06:00 UTC+3 = 03:00 UTC
    
    return toUnifiedTime(dayStart);
  },
  
  // Конец дня по UTC+3 (05:59:59 UTC+3 следующего дня)
  getCurrentDayEnd: (): UnifiedTime => {
    const dayStart = TimePeriods.getCurrentDayStart();
    const dayEnd = new Date(dayStart.utc.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    return toUnifiedTime(dayEnd);
  },
  
  // Текущая неделя
  getCurrentWeek: (): { start: UnifiedTime; end: UnifiedTime } => {
    const dayStart = TimePeriods.getCurrentDayStart();
    const currentDay = new Date(dayStart.utc);
    
    const dayOfWeek = currentDay.getUTCDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const weekStart = new Date(currentDay);
    weekStart.setUTCDate(currentDay.getUTCDate() - daysFromMonday);
    weekStart.setHours(3, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7);
    weekEnd.setHours(2, 59, 59, 999);
    
    return {
      start: toUnifiedTime(weekStart),
      end: toUnifiedTime(weekEnd)
    };
  },
  
  // Текущий месяц
  getCurrentMonth: (): { start: UnifiedTime; end: UnifiedTime } => {
    const unified = getUnifiedTime();
    let year = unified.utc3.getUTCFullYear();
    let month = unified.utc3.getUTCMonth();
    
    if (unified.utc3.getHours() < 6 && unified.utc3.getUTCDate() === 1) {
      month = month - 1;
      if (month < 0) {
        month = 11;
        year = year - 1;
      }
    }
    
    const monthStart = new Date(Date.UTC(year, month, 1));
    monthStart.setHours(3, 0, 0, 0);
    
    const nextMonthStart = new Date(Date.UTC(year, month + 1, 1));
    nextMonthStart.setHours(3, 0, 0, 0);
    const monthEnd = new Date(nextMonthStart.getTime() - 1);
    
    return {
      start: toUnifiedTime(monthStart),
      end: toUnifiedTime(monthEnd)
    };
  }
};

/**
 * Работа со сменами
 */
export const ShiftTime = {
  // Определение типа смены
  getShiftType: (time?: UnifiedTime): 'MORNING' | 'DAY' | 'NIGHT' => {
    const unified = time || getUnifiedTime();
    const hour = unified.utc3.getHours();
    
    if (hour >= 6 && hour < 14) {
      return 'MORNING'; // 06:00 - 14:00 UTC+3
    } else if (hour >= 14 && hour < 22) {
      return 'DAY'; // 14:00 - 22:00 UTC+3
    } else {
      return 'NIGHT'; // 22:00 - 06:00 UTC+3
    }
  },
  
  // Проверка доступности смены
  isShiftAvailable: (shiftType: 'MORNING' | 'DAY' | 'NIGHT', time?: UnifiedTime): boolean => {
    const unified = time || getUnifiedTime();
    const hour = unified.utc3.getHours();
    const minute = unified.utc3.getMinutes();
    
    const currentMinutes = hour * 60 + minute;
    
    const shiftTimes = {
      MORNING: { start: 6 * 60, end: 14 * 60 }, // 06:00 - 14:00
      DAY: { start: 14 * 60, end: 22 * 60 },    // 14:00 - 22:00
      NIGHT: { start: 22 * 60, end: 6 * 60 + 24 * 60 } // 22:00 - 06:00+24
    };
    
    const shift = shiftTimes[shiftType];
    
    // Для ночной смены особая логика (переход через полночь)
    if (shiftType === 'NIGHT') {
      return currentMinutes >= 22 * 60 || currentMinutes < 6 * 60;
    }
    
    // Разрешаем начать смену за 30 минут до старта
    return currentMinutes >= (shift.start - 30) && currentMinutes < shift.end;
  }
};

/**
 * Миграция со старых функций
 * @deprecated Используйте getUnifiedTime().utc3 вместо getCurrentUTC3Time()
 */
export function getCurrentUTC3Time(): Date {
  console.warn('DEPRECATED: Используйте getUnifiedTime().utc3 вместо getCurrentUTC3Time()');
  return getUnifiedTime().utc3;
}

/**
 * @deprecated Используйте getUnifiedTime().utc вместо getCurrentUTCTime()
 */
export function getCurrentUTCTime(): Date {
  console.warn('DEPRECATED: Используйте getUnifiedTime().utc вместо getCurrentUTCTime()');
  return getUnifiedTime().utc;
}
