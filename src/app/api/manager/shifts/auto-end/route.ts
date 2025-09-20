import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManagerAuth } from "@/lib/api-auth";
import { getSystemTime } from '@/lib/system-time';
import { ProcessorLogger } from "@/lib/processor-logger";
import { SalaryLogger } from "@/lib/salary-logger";
import { requireAuth } from '@/lib/api-auth';

/**
 * Проверяет и автоматически завершает смены, которые должны быть завершены
 * Этот endpoint вызывается периодически для автозавершения просроченных смен
 */
export async function POST(request: NextRequest) {
  try {
  

    const authResult = await requireAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;

// Проверяем авторизацию
  const now = getSystemTime();
    const todayStart = new Date(now);
    todayStart.setUTCHours(3, 0, 0, 0); // Начало дня по UTC+3 = 06:00 UTC+3 = 03:00 UTC

    // Ищем активную смену пользователя
    const activeShift = await prisma.processor_shifts.findFirst({
      where: {
        processorId: user.userId,
        status: 'ACTIVE',
        shiftDate: todayStart,
      }
    });

    if (!activeShift || !activeShift.scheduledEnd) {
      return NextResponse.json({ 
        message: "Нет активных смен для автозавершения",
        autoEnded: false 
      });
    }

    // Проверяем автозавершение смены (если прошло больше 30 минут после запланированного окончания)
    const thirtyMinutesAfterEnd = new Date(activeShift.scheduledEnd.getTime() + 30 * 60 * 1000);
    
    if (now > thirtyMinutesAfterEnd) {
      console.log(`🔄 Автозавершение смены ${activeShift.id} для процессора ${user.userId}`);
      
      // Автоматически завершаем смену
      const autoEndedShift = await prisma.processor_shifts.update({
        where: { id: activeShift.id },
        data: {
          actualEnd: thirtyMinutesAfterEnd,
          status: 'COMPLETED',
          notes: (activeShift.notes || '') + ' [Автозавершена системой через 30 мин после окончания]'
        }
      });

      // Логируем автозавершение
      await ProcessorLogger.logShiftEnd(
        user.userId, 
        activeShift.shiftType, 
        thirtyMinutesAfterEnd.getTime() - new Date(activeShift.actualStart!).getTime(), 
        request, 
        true // автозавершение
      );

      // Рассчитываем и логируем все заработки за автозавершенную смену
      await calculateAndLogShiftEarnings(user.userId, activeShift.id, autoEndedShift);

      return NextResponse.json({ 
        shift: autoEndedShift, 
        autoEnded: true,
        message: "Смена была автоматически завершена системой через 30 минут после окончания" 
      });
    }

    // Смена еще не требует автозавершения
    const minutesLeft = Math.round((thirtyMinutesAfterEnd.getTime() - now.getTime()) / (1000 * 60));
    return NextResponse.json({ 
      message: `Смена будет автозавершена через ${minutesLeft} минут`,
      autoEnded: false,
      minutesUntilAutoEnd: minutesLeft
    });

  } catch (error) {
    console.error('Ошибка автозавершения смены:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера при автозавершении смены" },
      { status: 500 }
    );
  }
}

/**
 * Рассчитывает и логирует все заработки за завершенную смену
 */
async function calculateAndLogShiftEarnings(
  processorId: string, 
  shiftId: string, 
  shift: { actualStart?: Date | null; actualEnd?: Date | null; shiftType: string; [key: string]: unknown }
) {
  try {
    console.log(`[SHIFT_EARNINGS] Начинаем расчет заработков за автозавершенную смену ${shiftId} для процессора ${processorId}`);

    // 1. Рассчитываем часовую оплату
    if (shift.actualStart && shift.actualEnd) {
      const actualStartTime = new Date(shift.actualStart);
      const actualEndTime = new Date(shift.actualEnd);
      
      // Проверяем корректность времени
      if (actualEndTime <= actualStartTime) {
        console.warn(`[SHIFT_EARNINGS] Некорректное время автозавершенной смены ${shiftId}: конец (${actualEndTime.toISOString()}) раньше или равен началу (${actualStartTime.toISOString()})`);
        return;
      }
      
      const shiftDurationMs = actualEndTime.getTime() - actualStartTime.getTime();
      const shiftHours = shiftDurationMs / (1000 * 60 * 60);

      // Получаем настройки зарплаты для процессора
      const salarySettings = await prisma.salary_settings.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      const hourlyRate = salarySettings?.hourlyRate || 2.0; // Дефолтная ставка $2/час

      // Дополнительная проверка на разумные границы (не более 24 часов за смену)
      if (shiftHours > 0 && shiftHours <= 24) {
        const hourlyPayment = shiftHours * hourlyRate;
        await SalaryLogger.logShiftHourlyPay(
          processorId,
          shiftId,
          shiftHours,
          hourlyRate,
          hourlyPayment
        );
        console.log(`[SHIFT_EARNINGS] Начислено ${hourlyPayment}$ за ${shiftHours.toFixed(2)} часов автозавершенной смены`);
      } else {
        console.warn(`[SHIFT_EARNINGS] Некорректная продолжительность автозавершенной смены: ${shiftHours.toFixed(2)} часов`);
      }
    }

    // 2. Рассчитываем заработки от депозитов за смену
    const shiftDeposits = await prisma.processor_deposits.findMany({
      where: {
        processorId,
        status: 'APPROVED',
        createdAt: {
          gte: shift.actualStart || undefined,
          lte: shift.actualEnd || new Date(),
        },
      },
    });

    console.log(`[SHIFT_DEPOSITS] Найдено ${shiftDeposits.length} одобренных депозитов за автозавершенную смену`);

    // Логируем заработки от каждого депозита
    for (const deposit of shiftDeposits) {
      if (deposit.processorEarnings > 0) {
        await SalaryLogger.logDepositEarnings(
          processorId,
          deposit.id,
          shiftId,
          deposit.processorEarnings,
          deposit.amount,
          deposit.commissionRate,
          deposit.bonusAmount
        );
      }
    }

    console.log(`[SHIFT_EARNINGS] ✓ Завершен расчет заработков за автозавершенную смену ${shiftId}`);

  } catch (error) {
    console.error(`[SHIFT_EARNINGS] ERROR: Ошибка при расчете заработков за автозавершенную смену ${shiftId}:`, error);
    // Не прерываем завершение смены из-за ошибок в логировании
  }
}
