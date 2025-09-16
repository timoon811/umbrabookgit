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
    
    // Получаем назначенные смены для текущего пользователя
    const userAssignments = await prisma.user_shift_assignments.findMany({
      where: {
        userId: user.userId,
        isActive: true
      }
    });

    const assignedShiftIds = new Set(userAssignments.map(a => a.shiftSettingId));
    
    // Получаем только те настройки смен, которые назначены пользователю и активны
    const shiftSettings = await prisma.shift_settings.findMany({
      where: { 
        isActive: true,
        id: { in: Array.from(assignedShiftIds) }
      },
      orderBy: { startHour: 'asc' }
    });

    if (shiftSettings.length === 0) {
      return NextResponse.json({
        availableShifts: [],
        currentShiftType: null,
        currentTime: now.toISOString(),
        message: "Вам не назначены смены. Обратитесь к администратору для назначения смен."
      });
    }
    
    const availableShifts = shiftSettings.map(setting => {
      const { shiftType, startHour, startMinute, endHour, endMinute, name, description } = setting;
      
      // Формируем время начала и окончания для отображения
      const startTimeStr = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
      const displayEndHour = endHour >= 24 ? endHour - 24 : endHour;
      const endTimeStr = `${displayEndHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      let timeDisplay = `${startTimeStr} - ${endTimeStr}`;
      if (endHour >= 24) {
        timeDisplay += ' (+1 день)';
      }
      
      // Определяем, является ли данная смена текущей по времени
      const currentHour = now.getUTCHours();
      const currentMinute = now.getUTCMinutes();
      const currentTotalMinutes = currentHour * 60 + currentMinute;
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
        // Активна за 30 минут до начала до конца смены
        const canStartFromMinutes = shiftStartMinutes > 30 ? shiftStartMinutes - 30 : (24 * 60) - 30; // Для 00:01 = 23:31
        isCurrent = (currentTotalMinutes >= canStartFromMinutes) || (currentTotalMinutes < shiftEndMinutes);
      } else {
        // Обычная смена в пределах одного дня
        isCurrent = currentTotalMinutes >= shiftStartMinutes && currentTotalMinutes < shiftEndMinutes;
      }
      
      return {
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
        icon: shiftType === 'MORNING' ? 'sunrise' : 
              shiftType === 'DAY' ? 'sun' : 'moon'
      };
    });

    // Определяем текущую смену из доступных
    const currentShift = availableShifts.find(shift => shift.isCurrent);
    const currentShiftType = currentShift?.type || null;
    
    return NextResponse.json({
      availableShifts,
      currentShiftType,
      currentTime: now.toISOString()
    });
  } catch (error) {
    console.error('Ошибка получения доступных смен:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
