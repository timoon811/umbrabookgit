import { NextRequest, NextResponse } from "next/server";
import { requireManagerAuth } from "@/lib/api-auth";
import { getSystemTime } from '@/lib/system-time';
import { prisma } from "@/lib/prisma";
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;

// Проверяем авторизацию
  const now = getSystemTime();
    
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
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
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
      
      // Логика определения текущей смены с учетом возможности начать за 30 минут до старта
      const thirtyMinutesBefore = shiftStartMinutes - 30;
      
      // Проверяем тип смены
      const isNightShift = shiftType === 'NIGHT';
      const isCrossMidnightShift = endHour < startHour || (endHour === startHour && endMinute <= startMinute);
      
      if (isNightShift && startHour === 0) {
        // Ночная смена типа 00:01-08:01 
        // Можно начать с 23:31 предыдущего дня до 08:01
        const canStartFrom = (24 * 60) - 30; // 23:30
        isCurrent = (currentTotalMinutes >= canStartFrom) || (currentTotalMinutes < shiftEndMinutes);
      } else if (isCrossMidnightShift) {
        // Смена через полночь типа 22:00-06:00
        // ✅ ИСПРАВЛЕНИЕ: Используем < вместо <= для избежания пересечения смен
        isCurrent = (currentTotalMinutes >= shiftStartMinutes) || (currentTotalMinutes < shiftEndMinutes);
      } else {
        // Обычная дневная смена в пределах одного дня
        // Можно начать за 30 минут до старта
        const canStartFrom = thirtyMinutesBefore >= 0 ? thirtyMinutesBefore : 0;
        // ✅ ИСПРАВЛЕНИЕ: Используем < вместо <= для избежания пересечения смен
        isCurrent = currentTotalMinutes >= canStartFrom && currentTotalMinutes < shiftEndMinutes;
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
