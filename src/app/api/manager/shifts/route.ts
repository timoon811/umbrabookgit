import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManagerAuth } from "@/lib/api-auth";
import { getCurrentUTC3Time, getShiftType, getShiftStartTime, getShiftEndTime } from "@/lib/time-utils";
import { ProcessorLogger } from "@/lib/processor-logger";

export async function GET(request: NextRequest) {
  // Проверяем авторизацию
  const authResult = await requireManagerAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { user } = authResult;

  try {
    // Получаем текущую смену или последнюю завершенную
    const now = getCurrentUTC3Time();
    const todayStart = new Date(now);
    todayStart.setUTCHours(6, 0, 0, 0); // Начало дня по UTC+3

    const currentShift = await prisma.processor_shifts.findFirst({
      where: {
        processorId: user.userId,
        shiftDate: todayStart,
      },
      orderBy: { createdAt: 'desc' }
    });

    // Если нет текущей смены, возвращаем null - пользователь должен создать смену через доступные смены
    if (!currentShift) {
      return NextResponse.json({ shift: null, isActive: false, timeRemaining: null });
    }

    // Проверяем автозавершение смены (если прошло больше 30 минут после запланированного окончания)
    if (currentShift.status === 'ACTIVE' && currentShift.scheduledEnd) {
      const thirtyMinutesAfterEnd = new Date(currentShift.scheduledEnd.getTime() + 30 * 60 * 1000);
      if (now > thirtyMinutesAfterEnd) {
        // Автоматически завершаем смену
        const autoEndedShift = await prisma.processor_shifts.update({
          where: { id: currentShift.id },
          data: {
            actualEnd: thirtyMinutesAfterEnd,
            status: 'COMPLETED',
            notes: (currentShift.notes || '') + ' [Автозавершена системой через 30 мин после окончания]'
          }
        });

        // Логируем автозавершение
        await ProcessorLogger.logShiftEnd(user.userId, currentShift.shiftType, 
          thirtyMinutesAfterEnd.getTime() - new Date(currentShift.actualStart!).getTime(), 
          request, true // автозавершение
        );

        return NextResponse.json({ 
          shift: autoEndedShift, 
          isActive: false, 
          timeRemaining: null,
          autoEnded: true,
          message: "Смена была автоматически завершена системой" 
        });
      }
    }

    // Вычисляем оставшееся время если смена активна
    let timeRemaining = null;
    if (currentShift.status === 'ACTIVE' && currentShift.scheduledEnd) {
      // Используем запланированное время окончания смены, а не 8 часов от начала
      timeRemaining = Math.max(0, currentShift.scheduledEnd.getTime() - now.getTime());
    }

    return NextResponse.json({
      shift: currentShift,
      isActive: currentShift.status === 'ACTIVE',
      timeRemaining
    });
  } catch (error) {
    console.error('Ошибка получения смены:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Проверяем авторизацию
  const authResult = await requireManagerAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { user } = authResult;

  try {
    const data = await request.json();
    const { action, shiftType } = data; // 'start', 'end' или 'create'

    const now = getCurrentUTC3Time();
    const todayStart = new Date(now);
    todayStart.setUTCHours(6, 0, 0, 0);

    if (action === 'create') {
      // Создаем новую смену с проверкой доступности
      if (!shiftType) {
        return NextResponse.json(
          { error: "Тип смены обязателен" },
          { status: 400 }
        );
      }

      // Проверяем, что смена разрешена администратором
      const shiftSetting = await prisma.shift_settings.findFirst({
        where: { 
          shiftType: shiftType,
          isActive: true 
        }
      });

      if (!shiftSetting) {
        return NextResponse.json(
          { error: "Данный тип смены недоступен. Обратитесь к администратору." },
          { status: 403 }
        );
      }

      // Проверяем, нет ли уже смены на сегодня
      const existingShift = await prisma.processor_shifts.findFirst({
        where: {
          processorId: user.userId,
          shiftDate: todayStart,
        }
      });

      if (existingShift) {
        return NextResponse.json(
          { error: "Смена на сегодня уже создана" },
          { status: 400 }
        );
      }

      // Создаем смену на основе настроек
      const scheduledStart = new Date(todayStart);
      scheduledStart.setUTCHours(shiftSetting.startHour, shiftSetting.startMinute, 0, 0);

      const scheduledEnd = new Date(todayStart);
      if (shiftSetting.endHour >= 24) {
        scheduledEnd.setUTCDate(scheduledEnd.getUTCDate() + 1);
        scheduledEnd.setUTCHours(shiftSetting.endHour - 24, shiftSetting.endMinute, 0, 0);
      } else {
        scheduledEnd.setUTCHours(shiftSetting.endHour, shiftSetting.endMinute, 0, 0);
      }

      const newShift = await prisma.processor_shifts.create({
        data: {
          processorId: user.userId,
          shiftType: shiftType,
          shiftDate: todayStart,
          scheduledStart,
          scheduledEnd,
          status: 'SCHEDULED'
        }
      });

      return NextResponse.json({
        shift: newShift,
        isActive: false,
        message: "Смена успешно создана"
      });
    }

    if (action === 'start') {
      // Начинаем смену
      const shift = await prisma.processor_shifts.findFirst({
        where: {
          processorId: user.userId,
          shiftDate: todayStart,
        }
      });

      if (!shift) {
        return NextResponse.json(
          { error: "Смена не найдена" },
          { status: 404 }
        );
      }

      if (shift.status === 'ACTIVE') {
        return NextResponse.json(
          { error: "Смена уже активна" },
          { status: 400 }
        );
      }

      const updatedShift = await prisma.processor_shifts.update({
        where: { id: shift.id },
        data: {
          actualStart: now,
          status: 'ACTIVE'
        }
      });

      // Логируем начало смены
      await ProcessorLogger.logShiftStart(user.userId, shift.shiftType, request);

      return NextResponse.json({
        shift: updatedShift,
        isActive: true,
        message: "Смена начата"
      });
    }

    if (action === 'end') {
      // Завершаем смену
      const shift = await prisma.processor_shifts.findFirst({
        where: {
          processorId: user.userId,
          shiftDate: todayStart,
          status: 'ACTIVE'
        }
      });

      if (!shift) {
        return NextResponse.json(
          { error: "Активная смена не найдена" },
          { status: 404 }
        );
      }

      const updatedShift = await prisma.processor_shifts.update({
        where: { id: shift.id },
        data: {
          actualEnd: now,
          status: 'COMPLETED'
        }
      });

      // Рассчитываем продолжительность смены
      const duration = shift.actualStart ? now.getTime() - new Date(shift.actualStart).getTime() : 0;
      
      // Логируем завершение смены
      await ProcessorLogger.logShiftEnd(user.userId, shift.shiftType, duration, request);

      return NextResponse.json({
        shift: updatedShift,
        isActive: false,
        message: "Смена завершена"
      });
    }

    return NextResponse.json(
      { error: "Неверное действие" },
      { status: 400 }
    );
  } catch (error) {
    console.error('Ошибка управления сменой:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
