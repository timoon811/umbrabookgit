import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManagerAuth } from "@/lib/api-auth";
import { getCurrentUTC3Time } from "@/lib/time-utils";
import { ProcessorLogger } from "@/lib/processor-logger";
import { SalaryLogger } from "@/lib/salary-logger";

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

        // Рассчитываем и логируем все заработки за автозавершенную смену
        await calculateAndLogShiftEarnings(user.userId, currentShift.id, autoEndedShift);

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
      timeRemaining,
      serverTime: now.getTime() // Добавляем серверное время для синхронизации
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

      // Проверяем, что смена назначена текущему пользователю
      const userAssignment = await prisma.user_shift_assignments.findFirst({
        where: {
          userId: user.userId,
          shiftSettingId: shiftSetting.id,
          isActive: true
        }
      });

      if (!userAssignment) {
        return NextResponse.json(
          { error: "Данная смена не назначена вам администратором. Обратитесь к администратору для назначения смены." },
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
        message: "Смена начата",
        serverTime: now.getTime() // Добавляем серверное время для синхронизации
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
  shift: any
) {
  try {
    console.log(`[SHIFT_EARNINGS] Начинаем расчет заработков за смену ${shiftId} для процессора ${processorId}`);

    // 1. Рассчитываем часовую оплату
    if (shift.actualStart && shift.actualEnd) {
      const shiftDurationMs = new Date(shift.actualEnd).getTime() - new Date(shift.actualStart).getTime();
      const shiftHours = shiftDurationMs / (1000 * 60 * 60);

      // Получаем настройки зарплаты для процессора
      const salarySettings = await prisma.salary_settings.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      const hourlyRate = salarySettings?.hourlyRate || 10; // Дефолтная ставка $10/час

      if (shiftHours > 0) {
        const hourlyPayment = shiftHours * hourlyRate;
        await SalaryLogger.logShiftHourlyPay(
          processorId,
          shiftId,
          shiftHours,
          hourlyRate,
          hourlyPayment
        );
      }
    }

    // 2. Рассчитываем заработки от депозитов за смену
    const shiftDeposits = await prisma.processor_deposits.findMany({
      where: {
        processorId,
        status: 'APPROVED',
        createdAt: {
          gte: shift.actualStart,
          lte: shift.actualEnd || new Date(),
        },
      },
    });

    console.log(`[SHIFT_DEPOSITS] Найдено ${shiftDeposits.length} одобренных депозитов за смену`);

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
          shiftType: shift.shiftType,
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
          status: 'APPROVED',
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

      const applicableMonthlyBonus = monthlyBonuses.find((bonus: any) => monthlyVolume >= bonus.minAmount);

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

    console.log(`[SHIFT_EARNINGS] ✓ Завершен расчет заработков за смену ${shiftId}`);

  } catch (error) {
    console.error(`[SHIFT_EARNINGS] ERROR: Ошибка при расчете заработков за смену ${shiftId}:`, error);
    // Не прерываем завершение смены из-за ошибок в логировании
  }
}
