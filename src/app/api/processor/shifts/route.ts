import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProcessorAuth } from "@/lib/api-auth";
import { getCurrentUTC3Time, getShiftType, getShiftStartTime, getShiftEndTime } from "@/lib/time-utils";

export async function GET(request: NextRequest) {
  // Проверяем авторизацию
  const authResult = await requireProcessorAuth(request);
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

    // Если нет текущей смены, создаем новую
    if (!currentShift) {
      const shiftType = getShiftType(now);
      const startTime = getShiftStartTime(shiftType);
      const endTime = getShiftEndTime(shiftType);

      const scheduledStart = new Date(now);
      scheduledStart.setUTCHours(startTime.hour, startTime.minute, 0, 0);

      const scheduledEnd = new Date(now);
      if (endTime.hour >= 24) {
        scheduledEnd.setUTCDate(scheduledEnd.getUTCDate() + 1);
        scheduledEnd.setUTCHours(endTime.hour - 24, endTime.minute, 0, 0);
      } else {
        scheduledEnd.setUTCHours(endTime.hour, endTime.minute, 0, 0);
      }

      const newShift = await prisma.processor_shifts.create({
        data: {
          processorId: user.userId,
          shiftType,
          shiftDate: todayStart,
          scheduledStart,
          scheduledEnd,
          status: 'SCHEDULED'
        }
      });

      return NextResponse.json({ shift: newShift, isActive: false, timeRemaining: null });
    }

    // Вычисляем оставшееся время если смена активна
    let timeRemaining = null;
    if (currentShift.status === 'ACTIVE' && currentShift.actualStart) {
      const endTime = new Date(currentShift.actualStart.getTime() + (8 * 60 * 60 * 1000)); // 8 часов
      timeRemaining = Math.max(0, endTime.getTime() - now.getTime());
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
  const authResult = await requireProcessorAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { user } = authResult;

  try {
    const data = await request.json();
    const { action } = data; // 'start' или 'end'

    const now = getCurrentUTC3Time();
    const todayStart = new Date(now);
    todayStart.setUTCHours(6, 0, 0, 0);

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
