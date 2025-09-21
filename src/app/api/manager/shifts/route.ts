import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManagerAuth } from "@/lib/api-auth";
import { getSystemTime } from '@/lib/system-time';
import { TimePeriods } from '@/lib/time-utils';
import { ProcessorLogger } from "@/lib/processor-logger";
import { SalaryLogger } from "@/lib/salary-logger";
import { requireAuth } from '@/lib/api-auth';
import { createShiftSafely } from "@/lib/shift-manager";
import { ShiftAutoCloser } from "@/lib/shift-auto-closer";

export async function GET(request: NextRequest) {
  try {
    // ДОБАВЛЕНО: Автоматическое закрытие просроченных смен
    await ShiftAutoCloser.checkAndCloseOverdueShifts();

    const authResult = await requireAuth(request);
  
    if ('error' in authResult) {
      return authResult.error;
    }
  
    const { user } = authResult;

    // ИСПРАВЛЕНО: Используем системное время
    // Получаем текущую смену или последнюю завершенную
    const systemTime = getSystemTime();
    const todayPeriod = TimePeriods.today();
    const todayStart = todayPeriod.start;

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

    // ПРИМЕЧАНИЕ: Автозавершение смены перенесено в отдельный endpoint для безопасности
    // Теперь смены автоматически завершаются только по расписанию, а не при каждом запросе

    // Вычисляем оставшееся время если смена активна
    let timeRemaining = null;
    if (currentShift.status === 'ACTIVE' && currentShift.scheduledEnd) {
      // Используем запланированное время окончания смены, а не 8 часов от начала
      timeRemaining = Math.max(0, currentShift.scheduledEnd.getTime() - systemTime.getTime());
    }

    return NextResponse.json({
      shift: currentShift,
      isActive: currentShift.status === 'ACTIVE',
      timeRemaining,
      serverTime: systemTime.toISOString() // ИСПРАВЛЕНО: Системное время для синхронизации
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
  try {
    // ДОБАВЛЕНО: Автоматическое закрытие просроченных смен при любой операции
    await ShiftAutoCloser.checkAndCloseOverdueShifts();

    const authResult = await requireAuth(request);
  
    if ('error' in authResult) {
      return authResult.error;
    }
  
    const { user } = authResult;

    const data = await request.json();
    const { action, shiftType } = data; // 'start', 'end' или 'create'

    // ИСПРАВЛЕНО: Используем системное время
    const systemTime = getSystemTime();
    const todayPeriod = TimePeriods.today();
    const todayStart = todayPeriod.start;

    if (action === 'create') {
      // ИСПРАВЛЕНО: Используем новый безопасный менеджер смен
      // Все проверки и защита от дублей выполняются централизованно
      const shiftResult = await createShiftSafely({
        processorId: user.userId,
        shiftType: shiftType,
        shiftDate: todayStart,
      });

      if (!shiftResult.success) {
        let statusCode = 400;
        
        // Определяем статус код по типу ошибки
        switch (shiftResult.code) {
          case 'UNAUTHORIZED':
            statusCode = 403;
            break;
          case 'ALREADY_EXISTS':
            statusCode = 400;
            break;
          case 'INVALID_DATA':
            statusCode = 400;
            break;
          case 'SYSTEM_ERROR':
            statusCode = 500;
            break;
        }
        
        return NextResponse.json(
          { error: shiftResult.error },
          { status: statusCode }
        );
      }

      return NextResponse.json({
        shift: shiftResult.shift,
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
          actualStart: systemTime,
          status: 'ACTIVE'
        }
      });

      // Логируем начало смены
      await ProcessorLogger.logShiftStart(user.userId, shift.shiftType, request);

      return NextResponse.json({
        shift: updatedShift,
        isActive: true,
        message: "Смена начата",
        serverTime: systemTime.getTime() // Добавляем серверное время для синхронизации
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

      // Проверяем корректность времени завершения
      if (shift.actualStart && systemTime <= new Date(shift.actualStart)) {
        return NextResponse.json(
          { error: "Время завершения не может быть раньше или равно времени начала смены" },
          { status: 400 }
        );
      }

      const updatedShift = await prisma.processor_shifts.update({
        where: { id: shift.id },
        data: {
          actualEnd: systemTime, // ИСПРАВЛЕНО: Используем системное время для БД
          status: 'COMPLETED'
        }
      });

      // Рассчитываем продолжительность смены
      const duration = shift.actualStart ? systemTime.getTime() - new Date(shift.actualStart).getTime() : 0;
      
      // Логируем завершение смены
      await ProcessorLogger.logShiftEnd(user.userId, shift.shiftType, duration, request);

      // Рассчитываем и логируем все заработки за смену
      await calculateAndLogShiftEarnings(user.userId, shift.id, shift);

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

/**
 * Рассчитывает и логирует все заработки за завершенную смену
 */
async function calculateAndLogShiftEarnings(
  processorId: string, 
  shiftId: string, 
  shift: { actualStart?: Date | null; actualEnd?: Date | null; shiftType: string; [key: string]: unknown }
) {
  try {
    // 1. Рассчитываем часовую оплату
    if (shift.actualStart && shift.actualEnd) {
      const actualStartTime = new Date(shift.actualStart);
      const actualEndTime = new Date(shift.actualEnd);
      
      // Проверяем корректность времени
      if (actualEndTime <= actualStartTime) {
        console.warn(`[SHIFT_EARNINGS] Некорректное время смены ${shiftId}: конец (${actualEndTime.toISOString()}) раньше или равен началу (${actualStartTime.toISOString()})`);
        return;
      }
      
      const shiftDurationMs = actualEndTime.getTime() - actualStartTime.getTime();
      const shiftHours = shiftDurationMs / (1000 * 60 * 60);

      // Получаем настройки зарплаты для процессора
      const salarySettings = await prisma.salary_settings.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      const hourlyRate = salarySettings?.hourlyRate || 10; // Дефолтная ставка $10/час

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
        } else {
        console.warn(`[SHIFT_EARNINGS] Некорректная продолжительность смены: ${shiftHours.toFixed(2)} часов`);
      }
    }

    // 2. Рассчитываем заработки от депозитов за смену
      const shiftDeposits = await prisma.processor_deposits.findMany({
        where: {
          processorId,
          createdAt: {
            gte: shift.actualStart || undefined,
            lte: shift.actualEnd || new Date(),
          },
        },
      });

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

    // 3. Рассчитываем бонусы за объем депозитов в смене
    const shiftVolume = shiftDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);
    
    if (shiftVolume > 0) {
      // Получаем настройки бонусной сетки для типа смены
      const bonusGrids = await prisma.bonus_grid.findMany({
        where: {
          shiftType: shift.shiftType as 'MORNING' | 'DAY' | 'NIGHT',
          isActive: true,
        },
        orderBy: { minAmount: 'desc' },
      });

      // Находим подходящий бонус
      const applicableBonus = bonusGrids.find(grid => shiftVolume >= grid.minAmount);
      
      if (applicableBonus && applicableBonus.bonusPercentage > 0) {
        const shiftBonusAmount = (shiftVolume * applicableBonus.bonusPercentage) / 100;
        
        await SalaryLogger.logEarnings({
          processorId,
          shiftId,
          type: 'SHIFT_BONUS',
          description: `Бонус за объем депозитов в смене: $${shiftVolume.toLocaleString()}`,
          amount: shiftBonusAmount,
          baseAmount: shiftVolume,
          percentage: applicableBonus.bonusPercentage,
          calculationDetails: `$${shiftVolume.toLocaleString()} * ${applicableBonus.bonusPercentage}% = $${shiftBonusAmount.toFixed(2)}`,
          metadata: {
            shiftVolume,
            bonusPercentage: applicableBonus.bonusPercentage,
            gridName: applicableBonus.description,
          },
        });
      }
    }

    // 4. Проверяем месячные бонусы (если это конец месяца)
    const today = new Date();
    const isEndOfMonth = today.getDate() === new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    if (isEndOfMonth) {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthlyDeposits = await prisma.processor_deposits.findMany({
      where: {
        processorId,
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    });

      const monthlyVolume = monthlyDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);

      // Получаем месячные планы
      const monthlyBonuses = await prisma.salary_monthly_bonus.findMany({
        where: { isActive: true },
        orderBy: { minAmount: 'desc' },
      });

      const applicableMonthlyBonus = monthlyBonuses.find((bonus: { minAmount: number; [key: string]: unknown }) => monthlyVolume >= bonus.minAmount);

      if (applicableMonthlyBonus && applicableMonthlyBonus.bonusPercent > 0) {
        const monthlyBonusAmount = (monthlyVolume * applicableMonthlyBonus.bonusPercent) / 100;
        
        await SalaryLogger.logMonthlyBonus(
          processorId,
          monthlyVolume,
          applicableMonthlyBonus.bonusPercent,
          monthlyBonusAmount,
          applicableMonthlyBonus.name,
          monthEnd
        );
      }
    }

    } catch (error) {
    console.error(`[SHIFT_EARNINGS] ERROR: Ошибка при расчете заработков за смену ${shiftId}:`, error);
    // Не прерываем завершение смены из-за ошибок в логировании
  }
}
