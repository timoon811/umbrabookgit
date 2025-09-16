import { NextRequest, NextResponse } from "next/server";
import { requireManagerAuth } from "@/lib/api-auth";
import { getCurrentUTC3Time } from "@/lib/time-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // Проверяем авторизацию
  const authResult = await requireManagerAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { user } = authResult;

  try {
    const now = getCurrentUTC3Time();
    
    // Получаем все настройки смен из базы данных
    const allShiftSettings = await prisma.shift_settings.findMany({
      orderBy: { startHour: 'asc' }
    });

    // Получаем назначенные смены для текущего пользователя
    const userAssignments = await prisma.user_shift_assignments.findMany({
      where: {
        userId: user.userId,
        isActive: true
      }
    });

    const assignedShiftIds = new Set(userAssignments.map(a => a.shiftSettingId));

    if (allShiftSettings.length === 0) {
      return NextResponse.json({
        shifts: [],
        currentTime: now.toISOString(),
        message: "Нет настроенных смен в системе. Обратитесь к администратору."
      });
    }

    // Определяем текущую смену по времени
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    const shifts = allShiftSettings.map(setting => {
      const { id, shiftType, startHour, startMinute, endHour, endMinute, name, description, isActive } = setting;
      
      // Формируем отображение времени
      const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
      
      // Правильная обработка времени окончания для ночных смен
      let displayEndHour = endHour;
      if (endHour >= 24) {
        displayEndHour = endHour - 24; // 30 -> 6, 25 -> 1, etc.
      }
      let endTime = `${displayEndHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      // Обработка ночных смен (переход через полночь)
      let timeDisplay = `${startTime} - ${endTime}`;
      if (endHour >= 24 || endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
        timeDisplay = `${startTime} - ${endTime} (+1)`;
      }

      // Определяем, является ли смена текущей по времени
      const shiftStartMinutes = startHour * 60 + startMinute;
      const shiftEndMinutes = endHour * 60 + endMinute;
      
      let isCurrent = false;
      
      // Проверяем тип смены
      const isNightShiftThroughMidnight = endHour >= 24 || endHour < startHour || (endHour === startHour && endMinute <= startMinute);
      const isEarlyMorningShift = shiftType === 'NIGHT' && startHour < 12; // Смены типа 00:00-08:00
      
      if (isNightShiftThroughMidnight) {
        // Обычная ночная смена через полночь (22:00-06:00)
        const actualEndMinutes = endHour >= 24 ? (endHour - 24) * 60 + endMinute : shiftEndMinutes;
        isCurrent = (currentTotalMinutes >= shiftStartMinutes) || (currentTotalMinutes < actualEndMinutes);
      } else if (isEarlyMorningShift) {
        // Раннеутренняя "ночная" смена (00:00-08:00)
        // Можно начать за 30 минут до начала (23:30) до конца смены (08:00)
        const canStartFromMinutes = (24 * 60) - 30; // 23:30 предыдущего дня
        isCurrent = (currentTotalMinutes >= canStartFromMinutes) || (currentTotalMinutes < shiftEndMinutes);
      } else {
        // Обычная смена в пределах одного дня
        isCurrent = currentTotalMinutes >= shiftStartMinutes && currentTotalMinutes < shiftEndMinutes;
      }

      // Определяем доступность смены для менеджера (должна быть активна и назначена пользователю)
      const isAvailableForManager = isActive && assignedShiftIds.has(id);
      
      // Определяем статус смены
      let status = 'inactive';
      if (!isActive) {
        status = 'disabled';
      } else if (isCurrent) {
        status = 'current';
      } else {
        status = 'available';
      }

      return {
        id,
        type: shiftType,
        name: name || (shiftType === 'MORNING' ? 'Утренняя смена' : 
                      shiftType === 'DAY' ? 'Дневная смена' : 'Ночная смена'),
        timeDisplay,
        startTime: { hour: startHour, minute: startMinute },
        endTime: { hour: endHour >= 24 ? endHour - 24 : endHour, minute: endMinute },
        description: description || (shiftType === 'MORNING' ? 'Утренняя смена для ранних пташек' :
                    shiftType === 'DAY' ? 'Дневная смена - основное рабочее время' :
                    'Ночная смена для работы в темное время суток'),
        isCurrent,
        isActive,
        isAvailableForManager,
        status,
        icon: shiftType === 'MORNING' ? 'sunrise' : 
              shiftType === 'DAY' ? 'sun' : 'moon'
      };
    });

    // Определяем текущую смену из доступных с приоритетом для ночных смен
    const currentShifts = shifts.filter(shift => shift.isCurrent && shift.isAvailableForManager);
    let currentShift = null;
    
    if (currentShifts.length > 1) {
      // Если несколько текущих смен, приоритет ночным сменам в ночное время
      const isNightTime = currentTotalMinutes < 360 || currentTotalMinutes >= 1410; // 00:00-06:00 или 23:30-24:00
      const nightShift = currentShifts.find(s => s.type === 'NIGHT');
      
      if (isNightTime && nightShift) {
        currentShift = nightShift;
      } else {
        currentShift = currentShifts[0];
      }
    } else {
      currentShift = currentShifts[0] || null;
    }
    
    const currentShiftType = currentShift?.type || null;
    
    return NextResponse.json({
      shifts,
      currentShiftType,
      currentTime: now.toISOString(),
      totalShifts: shifts.length,
      activeShifts: shifts.filter(s => s.isActive).length,
      availableShifts: shifts.filter(s => s.isAvailableForManager).length
    });
  } catch (error) {
    console.error('Ошибка получения всех смен:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
