/**
 * ЕДИНАЯ СИСТЕМА ВРЕМЕНИ ПЛАТФОРМЫ
 * 
 * ПРИНЦИП: Везде используем ТОЛЬКО системное время (new Date())
 * - База данных: всегда системное время (настройка сервера на UTC+3)
 * - Отображение: системное время (пользователи в UTC+3)
 * - Логика: системное время
 * 
 * НЕТ КОНВЕРТАЦИЙ. НЕТ ВРЕМЕННЫХ ЗОН. ТОЛЬКО new Date().
 */

/**
 * ГЛАВНАЯ ФУНКЦИЯ - получение системного времени
 * Замени все getCurrentUTC3Time(), getUnifiedTime() и сложные расчеты на эту функцию
 */
export function getSystemTime(): Date {
  return new Date();
}

/**
 * Форматирование времени для отображения пользователю
 */
export function formatSystemTime(date: Date | string, format: 'full' | 'date' | 'time' | 'datetime' = 'datetime'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Europe/Moscow', // Указываем явно для консистентности
  };
  
  switch (format) {
    case 'full':
      options.year = 'numeric';
      options.month = 'long';
      options.day = 'numeric';
      options.weekday = 'long';
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
      break;
    case 'date':
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      break;
    case 'time':
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
      break;
    case 'datetime':
    default:
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      options.hour = '2-digit';
      options.minute = '2-digit';
      break;
  }
  
  return d.toLocaleString('ru-RU', options);
}

/**
 * Создание времени с определенными часами и минутами на сегодня
 */
export function createSystemTimeToday(hours: number, minutes: number = 0): Date {
  const date = getSystemTime();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Создание времени с определенными часами и минутами на завтра
 */
export function createSystemTimeTomorrow(hours: number, minutes: number = 0): Date {
  const date = getSystemTime();
  date.setDate(date.getDate() + 1);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Проверка что время в прошлом
 */
export function isInPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() < getSystemTime().getTime();
}

/**
 * Проверка что время в будущем
 */
export function isInFuture(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() > getSystemTime().getTime();
}

/**
 * Разница между двумя датами в минутах
 */
export function getMinutesDifference(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60));
}

/**
 * Разница между двумя датами в часах
 */
export function getHoursDifference(date1: Date | string, date2: Date | string): number {
  return getMinutesDifference(date1, date2) / 60;
}

/**
 * Получение начала текущего дня
 */
export function getStartOfToday(): Date {
  const date = getSystemTime();
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Получение конца текущего дня
 */
export function getEndOfToday(): Date {
  const date = getSystemTime();
  date.setHours(23, 59, 59, 999);
  return date;
}

/**
 * Получение начала завтрашнего дня
 */
export function getStartOfTomorrow(): Date {
  const date = getSystemTime();
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * DEPRECATED ФУНКЦИИ - НЕ ИСПОЛЬЗУЙ!
 * Оставлены для обратной совместимости
 */
export function getCurrentUTC3Time(): Date {
  console.warn('DEPRECATED: getCurrentUTC3Time() - используй getSystemTime()');
  return getSystemTime();
}

export function getUnifiedTime() {
  console.warn('DEPRECATED: getUnifiedTime() - используй getSystemTime()');
  const now = getSystemTime();
  return {
    utc: now,
    utc3: now,
    timestamp: now.getTime()
  };
}
