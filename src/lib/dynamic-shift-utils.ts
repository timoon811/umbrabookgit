/**
 * ДИНАМИЧЕСКИЕ УТИЛИТЫ СМЕН
 * Функции для работы со сменами на основе настроек из БД
 */

import { prisma } from './prisma';
import { getSystemTime } from './system-time';

export type ShiftType = 'MORNING' | 'DAY' | 'NIGHT';

export interface ShiftSetting {
  id: string;
  shiftType: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  timezone: string;
  isActive: boolean;
  name: string | null;
  description: string | null;
}

/**
 * Получает все активные настройки смен из БД
 */
export async function getActiveShiftSettings(): Promise<ShiftSetting[]> {
  return await prisma.shift_settings.findMany({
    where: { isActive: true },
    orderBy: { startHour: 'asc' }
  });
}

/**
 * Проверяет, попадает ли время в определенную смену
 */
export function isTimeInShift(hour: number, minute: number, shiftSetting: ShiftSetting): boolean {
  const currentMinutes = hour * 60 + minute;
  const startMinutes = shiftSetting.startHour * 60 + shiftSetting.startMinute;
  const endMinutes = shiftSetting.endHour * 60 + shiftSetting.endMinute;
  
  // Смена через полночь (например, 22:00 - 06:00)
  if (shiftSetting.endHour < shiftSetting.startHour) {
    // Попадаем в конец смены (00:00 - 06:00)
    if (currentMinutes >= 0 && currentMinutes < endMinutes) {
      return true;
    }
    // Попадаем в начало смены (22:00 - 23:59)
    if (currentMinutes >= startMinutes && currentMinutes < 24 * 60) {
      return true;
    }
    return false;
  }
  
  // Обычная смена в пределах дня
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Определяет тип смены на основе настроек БД
 */
export async function getShiftTypeByTimeFromDB(time: Date = getSystemTime()): Promise<ShiftType | null> {
  const hour = time.getHours();
  const minute = time.getMinutes();
  
  try {
    const shiftSettings = await getActiveShiftSettings();
    
    for (const setting of shiftSettings) {
      if (isTimeInShift(hour, minute, setting)) {
        return setting.shiftType as ShiftType;
      }
    }
    
    return null; // Не найдена подходящая смена
  } catch (error) {
    console.error('Ошибка получения смены из БД:', error);
    
    // Fallback к статичной логике
    if (hour >= 6 && hour < 14) return 'MORNING' as ShiftType;
    if (hour >= 14 && hour < 22) return 'DAY' as ShiftType;
    return 'NIGHT' as ShiftType;
  }
}

/**
 * Получает информацию о смене по типу
 */
export async function getShiftSettingByType(shiftType: string): Promise<ShiftSetting | null> {
  try {
    return await prisma.shift_settings.findUnique({
      where: { shiftType }
    });
  } catch (error) {
    console.error('Ошибка получения настроек смены:', error);
    return null;
  }
}

/**
 * Получает все возможные смены с их расписанием
 */
export async function getAllShiftsSchedule(): Promise<Array<{
  type: string;
  name: string;
  timeDisplay: string;
  startTime: { hour: number; minute: number };
  endTime: { hour: number; minute: number };
  isCrossesMidnight: boolean;
}>> {
  try {
    const shiftSettings = await getActiveShiftSettings();
    
    return shiftSettings.map(setting => {
      const crossesMidnight = setting.endHour < setting.startHour;
      
      return {
        type: setting.shiftType,
        name: setting.name || setting.shiftType,
        timeDisplay: `${setting.startHour.toString().padStart(2, '0')}:${setting.startMinute.toString().padStart(2, '0')} - ${setting.endHour.toString().padStart(2, '0')}:${setting.endMinute.toString().padStart(2, '0')}${crossesMidnight ? ' (+1 день)' : ''}`,
        startTime: { hour: setting.startHour, minute: setting.startMinute },
        endTime: { hour: setting.endHour, minute: setting.endMinute },
        isCrossesMidnight: crossesMidnight
      };
    });
  } catch (error) {
    console.error('Ошибка получения расписания смен:', error);
    return [];
  }
}

/**
 * Проверяет, активна ли определенная смена в указанное время
 */
export async function isShiftActiveAtTime(shiftType: string, time: Date = getSystemTime()): Promise<boolean> {
  try {
    const setting = await getShiftSettingByType(shiftType);
    if (!setting || !setting.isActive) return false;
    
    return isTimeInShift(time.getHours(), time.getMinutes(), setting);
  } catch (error) {
    console.error('Ошибка проверки активности смены:', error);
    return false;
  }
}

/**
 * Получает следующую смену после указанного времени
 */
export async function getNextShift(time: Date = getSystemTime()): Promise<{
  shiftType: string;
  startTime: Date;
  timeUntilStart: number; // в миллисекундах
} | null> {
  try {
    const shiftSettings = await getActiveShiftSettings();
    const currentHour = time.getHours();
    const currentMinute = time.getMinutes();
    const currentMinutes = currentHour * 60 + currentMinute;
    
    let nextShift = null;
    let minTimeUntilStart = Infinity;
    
    for (const setting of shiftSettings) {
      const startMinutes = setting.startHour * 60 + setting.startMinute;
      let timeUntilStart;
      
      if (startMinutes > currentMinutes) {
        // Смена сегодня
        timeUntilStart = (startMinutes - currentMinutes) * 60 * 1000;
      } else {
        // Смена завтра
        timeUntilStart = ((24 * 60) - currentMinutes + startMinutes) * 60 * 1000;
      }
      
      if (timeUntilStart < minTimeUntilStart) {
        minTimeUntilStart = timeUntilStart;
        
        const startTime = new Date(time);
        if (startMinutes > currentMinutes) {
          startTime.setHours(setting.startHour, setting.startMinute, 0, 0);
        } else {
          startTime.setDate(startTime.getDate() + 1);
          startTime.setHours(setting.startHour, setting.startMinute, 0, 0);
        }
        
        nextShift = {
          shiftType: setting.shiftType,
          startTime,
          timeUntilStart: minTimeUntilStart
        };
      }
    }
    
    return nextShift;
  } catch (error) {
    console.error('Ошибка получения следующей смены:', error);
    return null;
  }
}
