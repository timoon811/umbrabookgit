/**
 * Утилиты для работы с временем и расчета 24-часовых периодов
 */

export interface TimePeriod {
  start: Date;
  end: Date;
  isCurrentPeriod: boolean;
}

/**
 * Получает текущее время в UTC
 */
export function getCurrentUTCTime(): Date {
  const now = new Date();
  return new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
}

/**
 * Получает начало текущего дня по UTC (00:00:00)
 */
export function getCurrentDayStartUTC(): Date {
  const utcNow = getCurrentUTCTime();
  const dayStart = new Date(utcNow);
  dayStart.setUTCHours(0, 0, 0, 0);
  return dayStart;
}

/**
 * Получает конец текущего дня по UTC (23:59:59.999)
 */
export function getCurrentDayEndUTC(): Date {
  const utcNow = getCurrentUTCTime();
  const dayEnd = new Date(utcNow);
  dayEnd.setUTCHours(23, 59, 59, 999);
  return dayEnd;
}

/**
 * Проверяет, находится ли дата в текущем дне (UTC)
 */
export function isInCurrentDay(date: Date): boolean {
  const dayStart = getCurrentDayStartUTC();
  const dayEnd = getCurrentDayEndUTC();
  return date >= dayStart && date <= dayEnd;
}

/**
 * Получает период для указанной даты (начало и конец дня по UTC)
 */
export function getDayPeriod(date: Date): TimePeriod {
  const utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
  
  const start = new Date(utcDate);
  start.setUTCHours(0, 0, 0, 0);
  
  const end = new Date(utcDate);
  end.setUTCHours(23, 59, 59, 999);
  
  const currentDayStart = getCurrentDayStartUTC();
  const isCurrentPeriod = start.getTime() === currentDayStart.getTime();
  
  return { start, end, isCurrentPeriod };
}

/**
 * Получает период для текущей недели (понедельник 00:00:00 - воскресенье 23:59:59 UTC)
 */
export function getCurrentWeekPeriod(): TimePeriod {
  const utcNow = getCurrentUTCTime();
  const dayOfWeek = utcNow.getUTCDay();
  
  // Понедельник = 1, воскресенье = 0
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const weekStart = new Date(utcNow);
  weekStart.setUTCDate(utcNow.getUTCDate() - daysFromMonday);
  weekStart.setUTCHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);
  
  return { start: weekStart, end: weekEnd, isCurrentPeriod: true };
}

/**
 * Получает период для текущего месяца (1-е число 00:00:00 - последний день 23:59:59 UTC)
 */
export function getCurrentMonthPeriod(): TimePeriod {
  const utcNow = getCurrentUTCTime();
  
  const monthStart = new Date(utcNow.getUTCFullYear(), utcNow.getUTCMonth(), 1);
  monthStart.setUTCHours(0, 0, 0, 0);
  
  const monthEnd = new Date(utcNow.getUTCFullYear(), utcNow.getUTCMonth() + 1, 0);
  monthEnd.setUTCHours(23, 59, 59, 999);
  
  return { start: monthStart, end: monthEnd, isCurrentPeriod: true };
}

/**
 * Форматирует дату для отображения с указанием UTC
 */
export function formatUTCDate(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', ' UTC');
}

/**
 * Получает человекочитаемое описание временного периода
 */
export function getTimePeriodDescription(period: TimePeriod): string {
  const startStr = formatUTCDate(period.start);
  const endStr = formatUTCDate(period.end);
  
  if (period.isCurrentPeriod) {
    return `Текущий период: ${startStr} - ${endStr}`;
  }
  
  return `Период: ${startStr} - ${endStr}`;
}

/**
 * Проверяет корректность 24-часового сброса
 * Возвращает true если сброс происходит в 00:00:00 UTC
 */
export function validate24HourReset(): boolean {
  const now = new Date();
  const utcNow = getCurrentUTCTime();
  const dayStart = getCurrentDayStartUTC();
  
  // Проверяем, что сброс происходит в 00:00:00 UTC
  const resetHour = dayStart.getUTCHours();
  const resetMinute = dayStart.getUTCMinutes();
  const resetSecond = dayStart.getUTCSeconds();
  
  const isValidReset = resetHour === 0 && resetMinute === 0 && resetSecond === 0;
  
  console.log(`🕐 Проверка 24-часового сброса:`);
  console.log(`   - Локальное время: ${now.toLocaleString()}`);
  console.log(`   - UTC время: ${utcNow.toISOString()}`);
  console.log(`   - Начало дня UTC: ${dayStart.toISOString()}`);
  console.log(`   - Сброс в ${resetHour}:${resetMinute}:${resetSecond} UTC - ${isValidReset ? '✅ Корректно' : '❌ Некорректно'}`);
  
  return isValidReset;
}
