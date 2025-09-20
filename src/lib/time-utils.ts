/**
 * УПРОЩЕННЫЕ УТИЛИТЫ ВРЕМЕНИ
 * Все работает на системном времени без конвертаций
 */

import { getSystemTime, createSystemTimeToday, createSystemTimeTomorrow } from './system-time';

export interface TimePeriod {
  start: Date;
  end: Date;
  isCurrentPeriod: boolean;
}

export type ShiftType = 'MORNING' | 'DAY' | 'NIGHT';

/**
 * Получает текущее системное время
 */
export function getCurrentUTC3Time(): Date {
  return getSystemTime();
}

/**
 * Получает начало текущего дня (06:00:00)
 */
export function getCurrentDayStartUTC3(): Date {
  const now = getSystemTime();
  const dayStart = new Date(now);
  
  // Если текущее время меньше 06:00, то день начался вчера в 06:00
  if (now.getHours() < 6) {
    dayStart.setDate(dayStart.getDate() - 1);
  }
  
  dayStart.setHours(6, 0, 0, 0);
  return dayStart;
}

/**
 * Получает конец текущего дня (05:59:59.999 следующего дня)
 */
export function getCurrentDayEndUTC3(): Date {
  const dayStart = getCurrentDayStartUTC3();
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  dayEnd.setMilliseconds(dayEnd.getMilliseconds() - 1);
  return dayEnd;
}

/**
 * Получение временных периодов для статистики
 */
export const TimePeriods = {
  // Сегодня (с 06:00 сегодня до 06:00 завтра)
  today: (): TimePeriod => {
    const start = getCurrentDayStartUTC3();
    const end = getCurrentDayEndUTC3();
    const now = getSystemTime();
    
    return {
      start,
      end,
      isCurrentPeriod: now >= start && now <= end
    };
  },

  // Вчера (с 06:00 позавчера до 06:00 сегодня)
  yesterday: (): TimePeriod => {
    const today = getCurrentDayStartUTC3();
    const start = new Date(today);
    start.setDate(start.getDate() - 1);
    
    const end = new Date(today);
    end.setMilliseconds(end.getMilliseconds() - 1);
    
    return {
      start,
      end,
      isCurrentPeriod: false
    };
  },

  // Текущая неделя (с понедельника 06:00)
  thisWeek: (): TimePeriod => {
    const today = getCurrentDayStartUTC3();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const start = new Date(today);
    start.setDate(start.getDate() + mondayOffset);
    
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    end.setMilliseconds(end.getMilliseconds() - 1);
    
    const now = getSystemTime();
    
    return {
      start,
      end,
      isCurrentPeriod: now >= start && now <= end
    };
  },

  // Текущий месяц
  thisMonth: (): TimePeriod => {
    const now = getSystemTime();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 6, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 5, 59, 59, 999);
    
    return {
      start,
      end,
      isCurrentPeriod: now >= start && now <= end
    };
  }
};

/**
 * Определение типа смены по времени
 */
export function getShiftTypeByTime(time: Date = getSystemTime()): ShiftType {
  const hour = time.getHours();
  
  if (hour >= 6 && hour < 14) {
    return 'MORNING';
  } else if (hour >= 14 && hour < 22) {
    return 'DAY';
  } else {
    return 'NIGHT';
  }
}

/**
 * Получение времени начала и конца смены
 */
export function getShiftTimes(shiftType: ShiftType, date: Date = getSystemTime()): { start: Date; end: Date } {
  switch (shiftType) {
    case 'MORNING':
      return {
        start: createSystemTimeToday(6, 0),
        end: createSystemTimeToday(14, 0)
      };
    case 'DAY':
      return {
        start: createSystemTimeToday(14, 0),
        end: createSystemTimeToday(22, 0)
      };
    case 'NIGHT':
      return {
        start: createSystemTimeToday(22, 0),
        end: createSystemTimeTomorrow(6, 0)
      };
    default:
      throw new Error(`Неизвестный тип смены: ${shiftType}`);
  }
}

/**
 * Проверка актуальности смены
 */
export function isShiftActive(shiftType: ShiftType, date: Date = getSystemTime()): boolean {
  const { start, end } = getShiftTimes(shiftType, date);
  return date >= start && date <= end;
}
