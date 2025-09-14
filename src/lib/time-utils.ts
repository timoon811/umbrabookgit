/**
 * Утилиты для работы с временем и расчета 24-часовых периодов по UTC+3
 */

export interface TimePeriod {
  start: Date;
  end: Date;
  isCurrentPeriod: boolean;
}

export type ShiftType = 'MORNING' | 'DAY' | 'NIGHT';

/**
 * Получает текущее время в UTC+3
 */
export function getCurrentUTC3Time(): Date {
  const now = new Date();
  return new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (3 * 60 * 60 * 1000));
}

/**
 * Получает начало текущего дня по UTC+3 (06:00:00 UTC+3)
 * Сброс происходит в 06:00 UTC+3, что соответствует 03:00 UTC
 */
export function getCurrentDayStartUTC3(): Date {
  const utc3Now = getCurrentUTC3Time();
  const dayStart = new Date(utc3Now);
  dayStart.setUTCHours(6, 0, 0, 0); // 06:00 UTC+3 = 03:00 UTC
  return dayStart;
}

/**
 * Получает конец текущего дня по UTC+3 (05:59:59.999 UTC+3 следующего дня)
 */
export function getCurrentDayEndUTC3(): Date {
  const utc3Now = getCurrentUTC3Time();
  const dayEnd = new Date(utc3Now);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
  dayEnd.setUTCHours(5, 59, 59, 999); // 05:59:59.999 UTC+3 следующего дня
  return dayEnd;
}

/**
 * Получает начало дня для указанной даты по UTC+3
 */
export function getDayStartUTC3(date: Date): Date {
  const utc3Date = new Date(date.getTime() + (3 * 60 * 60 * 1000));
  const dayStart = new Date(utc3Date);
  dayStart.setUTCHours(6, 0, 0, 0); // 06:00 UTC+3
  return dayStart;
}

/**
 * Получает конец дня для указанной даты по UTC+3
 */
export function getDayEndUTC3(date: Date): Date {
  const utc3Date = new Date(date.getTime() + (3 * 60 * 60 * 1000));
  const dayEnd = new Date(utc3Date);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
  dayEnd.setUTCHours(5, 59, 59, 999); // 05:59:59.999 UTC+3 следующего дня
  return dayEnd;
}

/**
 * Проверяет, находится ли дата в текущем дне (UTC+3)
 */
export function isInCurrentDay(date: Date): boolean {
  const dayStart = getCurrentDayStartUTC3();
  const dayEnd = getCurrentDayEndUTC3();
  return date >= dayStart && date <= dayEnd;
}

/**
 * Получает период для указанной даты (начало и конец дня по UTC+3)
 */
export function getDayPeriod(date: Date): TimePeriod {
  const start = getDayStartUTC3(date);
  const end = getDayEndUTC3(date);

  const currentDayStart = getCurrentDayStartUTC3();
  const isCurrentPeriod = start.getTime() === currentDayStart.getTime();

  return { start, end, isCurrentPeriod };
}

/**
 * Получает период для текущей недели (понедельник 06:00:00 - воскресенье 05:59:59 UTC+3)
 */
export function getCurrentWeekPeriod(): TimePeriod {
  const utc3Now = getCurrentUTC3Time();
  const dayOfWeek = utc3Now.getUTCDay();

  // Понедельник = 1, воскресенье = 0
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const weekStart = new Date(utc3Now);
  weekStart.setUTCDate(utc3Now.getUTCDate() - daysFromMonday);
  weekStart.setUTCHours(6, 0, 0, 0); // 06:00 UTC+3

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 1);
  weekEnd.setUTCHours(5, 59, 59, 999); // 05:59:59.999 UTC+3 следующего дня

  return { start: weekStart, end: weekEnd, isCurrentPeriod: true };
}

/**
 * Получает период для текущего месяца (1-е число 06:00:00 - последний день 05:59:59 UTC+3)
 */
export function getCurrentMonthPeriod(): TimePeriod {
  const utc3Now = getCurrentUTC3Time();

  const monthStart = new Date(utc3Now.getUTCFullYear(), utc3Now.getUTCMonth(), 1);
  monthStart.setUTCHours(6, 0, 0, 0); // 06:00 UTC+3

  const monthEnd = new Date(utc3Now.getUTCFullYear(), utc3Now.getUTCMonth() + 1, 0);
  monthEnd.setUTCDate(monthEnd.getUTCDate() + 1);
  monthEnd.setUTCHours(5, 59, 59, 999); // 05:59:59.999 UTC+3 следующего дня

  return { start: monthStart, end: monthEnd, isCurrentPeriod: true };
}

/**
 * Определяет тип смены для указанного времени (UTC+3)
 */
export function getShiftType(date: Date): ShiftType {
  const utc3Time = new Date(date.getTime() + (3 * 60 * 60 * 1000));
  const hour = utc3Time.getUTCHours();

  if (hour >= 6 && hour < 14) {
    return 'MORNING'; // 06:00 - 14:00 UTC+3
  } else if (hour >= 14 && hour < 22) {
    return 'DAY'; // 14:00 - 22:00 UTC+3
  } else {
    return 'NIGHT'; // 22:00 - 06:00 UTC+3
  }
}

/**
 * Получает время начала смены для указанного типа (UTC+3)
 */
export function getShiftStartTime(shiftType: ShiftType): { hour: number; minute: number } {
  switch (shiftType) {
    case 'MORNING':
      return { hour: 6, minute: 0 }; // 06:00 UTC+3
    case 'DAY':
      return { hour: 14, minute: 0 }; // 14:00 UTC+3
    case 'NIGHT':
      return { hour: 22, minute: 0 }; // 22:00 UTC+3
    default:
      return { hour: 6, minute: 0 };
  }
}

/**
 * Получает время окончания смены для указанного типа (UTC+3)
 */
export function getShiftEndTime(shiftType: ShiftType): { hour: number; minute: number } {
  switch (shiftType) {
    case 'MORNING':
      return { hour: 14, minute: 0 }; // 14:00 UTC+3
    case 'DAY':
      return { hour: 22, minute: 0 }; // 22:00 UTC+3
    case 'NIGHT':
      return { hour: 30, minute: 0 }; // 06:00 UTC+3 следующего дня (30 часов)
    default:
      return { hour: 14, minute: 0 };
  }
}

/**
 * Форматирует дату для отображения с указанием UTC+3
 */
export function formatUTC3Date(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', ' UTC+3');
}

/**
 * Получает человекочитаемое описание временного периода
 */
export function getTimePeriodDescription(period: TimePeriod): string {
  const startStr = formatUTC3Date(period.start);
  const endStr = formatUTC3Date(period.end);

  if (period.isCurrentPeriod) {
    return `Текущий период: ${startStr} - ${endStr}`;
  }

  return `Период: ${startStr} - ${endStr}`;
}

/**
 * Проверяет корректность 24-часового сброса по UTC+3
 * Возвращает true если сброс происходит в 06:00:00 UTC+3
 */
export function validate24HourReset(): boolean {
  const now = new Date();
  const utc3Now = getCurrentUTC3Time();
  const dayStart = getCurrentDayStartUTC3();

  // Проверяем, что сброс происходит в 06:00:00 UTC+3
  const resetHour = dayStart.getUTCHours();
  const resetMinute = dayStart.getUTCMinutes();
  const resetSecond = dayStart.getUTCSeconds();

  const isValidReset = resetHour === 3 && resetMinute === 0 && resetSecond === 0; // 06:00 UTC+3 = 03:00 UTC

  console.log(`🕐 Проверка 24-часового сброса по UTC+3:`);
  console.log(`   - Локальное время: ${now.toLocaleString()}`);
  console.log(`   - UTC+3 время: ${utc3Now.toISOString()}`);
  console.log(`   - Начало дня UTC+3: ${dayStart.toISOString()}`);
  console.log(`   - Сброс в ${resetHour}:${resetMinute}:${resetSecond} UTC - ${isValidReset ? '✅ Корректно' : '❌ Некорректно'}`);

  return isValidReset;
}

/**
 * Получает текущее время в UTC (для обратной совместимости)
 */
export function getCurrentUTCTime(): Date {
  const now = new Date();
  return new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
}

/**
 * Получает начало текущего дня по UTC (для обратной совместимости)
 */
export function getCurrentDayStartUTC(): Date {
  const utcNow = getCurrentUTCTime();
  const dayStart = new Date(utcNow);
  dayStart.setUTCHours(0, 0, 0, 0);
  return dayStart;
}

/**
 * Получает конец текущего дня по UTC (для обратной совместимости)
 */
export function getCurrentDayEndUTC(): Date {
  const utcNow = getCurrentUTCTime();
  const dayEnd = new Date(utcNow);
  dayEnd.setUTCHours(23, 59, 59, 999);
  return dayEnd;
}

/**
 * Форматирует дату для отображения с указанием UTC (для обратной совместимости)
 */
export function formatUTCDate(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', ' UTC');
}
