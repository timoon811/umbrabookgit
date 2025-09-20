/**
 * БЕЗОПАСНЫЙ МЕНЕДЖЕР СМЕН
 * 
 * Централизованная система создания смен с полной защитой от дублирования
 * Используется во всех местах создания смен для единообразия защиты
 */

import { prisma } from "./prisma";
import { getUnifiedTime, TimePeriods } from "./unified-time";

export interface CreateShiftOptions {
  processorId: string;
  shiftType: 'MORNING' | 'DAY' | 'NIGHT';
  shiftDate?: Date; // Если не указано, используется текущий день
  scheduledStart?: Date;
  scheduledEnd?: Date;
  status?: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'MISSED';
  notes?: string;
  adminNotes?: string;
  bypassChecks?: boolean; // Только для админских операций
}

export interface ShiftCreationResult {
  success: boolean;
  shift?: any;
  error?: string;
  code?: 'ALREADY_EXISTS' | 'INVALID_DATA' | 'UNAUTHORIZED' | 'SYSTEM_ERROR';
}

/**
 * ГЛАВНАЯ ФУНКЦИЯ: Безопасное создание смены
 * Использует транзакции и UNIQUE ограничения для полной защиты от дублей
 */
export async function createShiftSafely(options: CreateShiftOptions): Promise<ShiftCreationResult> {
  try {
    const unifiedTime = getUnifiedTime();
    const dayPeriod = TimePeriods.getCurrentDayStart();
    
    // Определяем дату смены
    const shiftDate = options.shiftDate || dayPeriod.utc;
    
    // Валидация входных данных
    if (!options.processorId) {
      return {
        success: false,
        error: "ID пользователя обязателен",
        code: 'INVALID_DATA'
      };
    }
    
    if (!['MORNING', 'DAY', 'NIGHT'].includes(options.shiftType)) {
      return {
        success: false,
        error: "Неверный тип смены",
        code: 'INVALID_DATA'
      };
    }
    
    // Проверяем права на создание смены (если не bypassed)
    if (!options.bypassChecks) {
      const hasPermission = await checkShiftPermission(options.processorId, options.shiftType);
      if (!hasPermission.allowed) {
        return {
          success: false,
          error: hasPermission.reason,
          code: 'UNAUTHORIZED'
        };
      }
    }
    
    // Получаем настройки смены
    const shiftSettings = await getShiftSettings(options.shiftType);
    if (!shiftSettings && !options.bypassChecks) {
      return {
        success: false,
        error: "Настройки смены не найдены",
        code: 'INVALID_DATA'
      };
    }
    
    // Рассчитываем время начала и окончания (если не переданы)
    const { scheduledStart, scheduledEnd } = calculateShiftTimes(
      shiftDate,
      options.scheduledStart,
      options.scheduledEnd,
      shiftSettings
    );
    
    // АТОМАРНОЕ СОЗДАНИЕ СМЕНЫ С ЗАЩИТОЙ ОТ ДУБЛЕЙ
    try {
      const newShift = await prisma.$transaction(async (tx) => {
        // 1. Проверяем существующие смены в рамках транзакции
        const existingShift = await tx.processor_shifts.findFirst({
          where: {
            processorId: options.processorId,
            shiftDate: shiftDate,
          }
        });
        
        if (existingShift) {
          throw new Error("DUPLICATE_SHIFT");
        }
        
        // 2. Создаем смену
        return await tx.processor_shifts.create({
          data: {
            processorId: options.processorId,
            shiftType: options.shiftType,
            shiftDate: shiftDate,
            scheduledStart: scheduledStart,
            scheduledEnd: scheduledEnd,
            status: options.status || 'SCHEDULED',
            notes: options.notes || null,
            adminNotes: options.adminNotes || null,
          }
        });
      });
      
      // Логируем успешное создание
      console.log(`✅ [SHIFT_MANAGER] Смена создана: ${newShift.id} для пользователя ${options.processorId}`);
      
      return {
        success: true,
        shift: newShift
      };
      
    } catch (transactionError: any) {
      // Обрабатываем ошибки дублирования
      if (transactionError.message === "DUPLICATE_SHIFT") {
        return {
          success: false,
          error: "Смена на эту дату уже существует",
          code: 'ALREADY_EXISTS'
        };
      }
      
      // Обрабатываем Prisma unique constraint ошибки
      if (transactionError.code === 'P2002') {
        const constraintField = transactionError.meta?.target;
        if (constraintField && constraintField.includes('processorId') && constraintField.includes('shiftDate')) {
          return {
            success: false,
            error: "Смена на эту дату уже существует",
            code: 'ALREADY_EXISTS'
          };
        }
      }
      
      // Логируем неожиданные ошибки
      console.error(`❌ [SHIFT_MANAGER] Ошибка создания смены:`, transactionError);
      throw transactionError;
    }
    
  } catch (error: any) {
    console.error(`🚨 [SHIFT_MANAGER] Критическая ошибка:`, error);
    return {
      success: false,
      error: "Внутренняя ошибка системы",
      code: 'SYSTEM_ERROR'
    };
  }
}

/**
 * Проверка прав на создание смены
 */
async function checkShiftPermission(processorId: string, shiftType: string): Promise<{allowed: boolean, reason?: string}> {
  try {
    // Проверяем, что смена разрешена администратором
    const shiftSetting = await prisma.shift_settings.findFirst({
      where: { 
        shiftType: shiftType as any,
        isActive: true 
      }
    });

    if (!shiftSetting) {
      return {
        allowed: false,
        reason: "Данный тип смены недоступен. Обратитесь к администратору."
      };
    }

    // Проверяем, что смена назначена пользователю
    const userAssignment = await prisma.user_shift_assignments.findFirst({
      where: {
        userId: processorId,
        shiftSettingId: shiftSetting.id,
        isActive: true
      }
    });

    if (!userAssignment) {
      return {
        allowed: false,
        reason: "Данная смена не назначена вам администратором."
      };
    }
    
    return { allowed: true };
    
  } catch (error) {
    console.error(`❌ [SHIFT_MANAGER] Ошибка проверки прав:`, error);
    return {
      allowed: false,
      reason: "Ошибка проверки прав доступа"
    };
  }
}

/**
 * Получение настроек смены
 */
async function getShiftSettings(shiftType: string) {
  try {
    return await prisma.shift_settings.findFirst({
      where: {
        shiftType: shiftType as any,
        isActive: true
      }
    });
  } catch (error) {
    console.error(`❌ [SHIFT_MANAGER] Ошибка получения настроек:`, error);
    return null;
  }
}

/**
 * Расчёт времени начала и окончания смены
 */
function calculateShiftTimes(
  shiftDate: Date,
  providedStart?: Date,
  providedEnd?: Date,
  shiftSettings?: any
) {
  // Если время передано явно, используем его
  if (providedStart && providedEnd) {
    return {
      scheduledStart: providedStart,
      scheduledEnd: providedEnd
    };
  }
  
  // Если настройки смены есть, рассчитываем на их основе
  if (shiftSettings) {
    const scheduledStart = new Date(shiftDate);
    const startHourUTC = shiftSettings.startHour - 3; // UTC+3 -> UTC
    
    if (startHourUTC < 0) {
      scheduledStart.setUTCDate(scheduledStart.getUTCDate() - 1);
      scheduledStart.setHours(startHourUTC + 24, shiftSettings.startMinute, 0, 0);
    } else {
      scheduledStart.setHours(startHourUTC, shiftSettings.startMinute, 0, 0);
    }

    const scheduledEnd = new Date(shiftDate);
    if (shiftSettings.endHour >= 24) {
      scheduledEnd.setUTCDate(scheduledEnd.getUTCDate() + 1);
      const endHourUTC = (shiftSettings.endHour - 24) - 3;
      const normalizedEndHourUTC = endHourUTC < 0 ? endHourUTC + 24 : endHourUTC;
      scheduledEnd.setHours(normalizedEndHourUTC, shiftSettings.endMinute, 0, 0);
    } else {
      const endHourUTC = shiftSettings.endHour - 3;
      const crossesMidnight =
        shiftSettings.endHour < shiftSettings.startHour ||
        (shiftSettings.endHour === shiftSettings.startHour && shiftSettings.endMinute <= shiftSettings.startMinute);

      if (endHourUTC < 0 || crossesMidnight) {
        scheduledEnd.setUTCDate(scheduledEnd.getUTCDate() + 1);
        const normalizedEndHourUTC = endHourUTC < 0 ? endHourUTC + 24 : endHourUTC;
        scheduledEnd.setHours(normalizedEndHourUTC, shiftSettings.endMinute, 0, 0);
      } else {
        scheduledEnd.setHours(endHourUTC, shiftSettings.endMinute, 0, 0);
      }
    }
    
    return { scheduledStart, scheduledEnd };
  }
  
  // Дефолтные времена если настроек нет
  const scheduledStart = new Date(shiftDate);
  scheduledStart.setHours(6, 0, 0, 0); // 09:00 MSK = 06:00 UTC
  
  const scheduledEnd = new Date(shiftDate);
  scheduledEnd.setHours(14, 0, 0, 0); // 17:00 MSK = 14:00 UTC
  
  return { scheduledStart, scheduledEnd };
}

/**
 * УТИЛИТЫ ДЛЯ ПРОВЕРКИ СУЩЕСТВУЮЩИХ СМЕН
 */

export async function checkExistingShift(processorId: string, shiftDate?: Date): Promise<any | null> {
  const dayPeriod = TimePeriods.getCurrentDayStart();
  const targetDate = shiftDate || dayPeriod.utc;
  
  return await prisma.processor_shifts.findFirst({
    where: {
      processorId,
      shiftDate: targetDate,
    }
  });
}

export async function getShiftsForPeriod(processorId: string, startDate: Date, endDate: Date) {
  return await prisma.processor_shifts.findMany({
    where: {
      processorId,
      shiftDate: {
        gte: startDate,
        lte: endDate,
      }
    },
    orderBy: {
      shiftDate: 'asc'
    }
  });
}
