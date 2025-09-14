import { NextRequest, NextResponse } from "next/server";
import { requireProcessorAuth } from "@/lib/api-auth";
import { getCurrentUTC3Time } from "@/lib/time-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // Проверяем авторизацию
  const authResult = await requireProcessorAuth(request);
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
      let endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      // Обработка ночных смен (переход через полночь)
      let timeDisplay = `${startTime} - ${endTime}`;
      if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
        timeDisplay = `${startTime} - ${endTime} (+1)`;
      }

      // Определяем, является ли смена текущей по времени
      const shiftStartMinutes = startHour * 60 + startMinute;
      let shiftEndMinutes = endHour * 60 + endMinute;
      
      // Обработка ночных смен
      if (shiftEndMinutes <= shiftStartMinutes) {
        shiftEndMinutes += 24 * 60;
      }
      
      let isCurrent = false;
      if (shiftStartMinutes < shiftEndMinutes) {
        // Обычная смена в пределах одного дня
        isCurrent = currentTotalMinutes >= shiftStartMinutes && currentTotalMinutes < shiftEndMinutes;
      } else {
        // Ночная смена через полночь
        isCurrent = currentTotalMinutes >= shiftStartMinutes || 
                   currentTotalMinutes < (shiftEndMinutes - 24 * 60);
      }

      // Определяем доступность смены для процессора (должна быть активна и назначена пользователю)
      const isAvailableForProcessor = isActive && assignedShiftIds.has(id);
      
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
        endTime: { hour: endHour, minute: endMinute },
        description: description || (shiftType === 'MORNING' ? 'Утренняя смена для ранних пташек' :
                    shiftType === 'DAY' ? 'Дневная смена - основное рабочее время' :
                    'Ночная смена для работы в темное время суток'),
        isCurrent,
        isActive,
        isAvailableForProcessor,
        status,
        icon: shiftType === 'MORNING' ? 'sunrise' : 
              shiftType === 'DAY' ? 'sun' : 'moon'
      };
    });

    // Определяем текущую смену из доступных
    const currentShift = shifts.find(shift => shift.isCurrent);
    const currentShiftType = currentShift?.type || null;
    
    return NextResponse.json({
      shifts,
      currentShiftType,
      currentTime: now.toISOString(),
      totalShifts: shifts.length,
      activeShifts: shifts.filter(s => s.isActive).length,
      availableShifts: shifts.filter(s => s.isAvailableForProcessor).length
    });
  } catch (error) {
    console.error('Ошибка получения всех смен:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
