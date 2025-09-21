import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSystemTime } from '@/lib/system-time';
import { ProcessorLogger } from "@/lib/processor-logger";
import { SalaryLogger } from "@/lib/salary-logger";

/**
 * CRON endpoint для автоматического закрытия просроченных смен
 * Не требует авторизации - предназначен для внешних планировщиков
 * Безопасность обеспечивается секретным ключом
 */
export async function POST(request: NextRequest) {
  try {
    // Проверяем секретный ключ для cron (если настроен)
    const cronSecret = process.env.CRON_SECRET_KEY;
    if (cronSecret) {
      const providedSecret = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                           request.headers.get('X-Cron-Secret') ||
                           new URL(request.url).searchParams.get('secret');
      
      if (providedSecret !== cronSecret) {
        return NextResponse.json(
          { error: "Неавторизованный доступ к cron эндпоинту" },
          { status: 401 }
        );
      }
    }

    const now = getSystemTime();
    console.log(`🔄 [CRON-AUTO-CLOSE] Запуск автозакрытия смен: ${now.toISOString()}`);

    // Находим все активные смены, которые должны быть завершены
    const activeShifts = await prisma.processor_shifts.findMany({
      where: {
        status: 'ACTIVE',
        scheduledEnd: {
          lt: new Date(now.getTime() - 30 * 60 * 1000) // Прошло больше 30 минут после окончания
        }
      },
      include: {
        processor: {
          select: {
            name: true,
            email: true,
            telegram: true
          }
        }
      }
    });

    console.log(`🔍 [CRON-AUTO-CLOSE] Найдено ${activeShifts.length} смен для автозакрытия`);

    if (activeShifts.length === 0) {
      return NextResponse.json({
        message: "Зависших смен не найдено",
        totalChecked: 0,
        successfullyEnded: 0,
        errors: 0,
        checkedAt: now.toISOString()
      });
    }

    const results = [];

    for (const shift of activeShifts) {
      try {
        const thirtyMinutesAfterEnd = new Date(shift.scheduledEnd!.getTime() + 30 * 60 * 1000);
        
        console.log(`⏰ [CRON-AUTO-CLOSE] Завершаем смену ${shift.id} пользователя ${shift.processor.name}`);

        // Автоматически завершаем смену
        const autoEndedShift = await prisma.processor_shifts.update({
          where: { id: shift.id },
          data: {
            actualEnd: thirtyMinutesAfterEnd,
            status: 'COMPLETED',
            notes: (shift.notes || '') + ' [Автозавершена CRON через 30 мин после окончания]'
          }
        });

        // Логируем автозавершение (если возможно)
        try {
          await ProcessorLogger.logShiftEnd(
            shift.processorId,
            shift.shiftType,
            thirtyMinutesAfterEnd.getTime() - new Date(shift.actualStart!).getTime(),
            request,
            true // автозавершение
          );
        } catch (logError) {
          console.warn(`⚠️ [CRON-AUTO-CLOSE] Не удалось записать лог для смены ${shift.id}:`, logError);
        }

        // Рассчитываем и логируем заработки за автозавершенную смену
        await calculateShiftEarnings(shift.processorId, shift.id, autoEndedShift);

        results.push({
          shiftId: shift.id,
          processorId: shift.processorId,
          processorName: shift.processor.name,
          shiftType: shift.shiftType,
          autoEndedAt: thirtyMinutesAfterEnd.toISOString(),
          success: true
        });

        console.log(`✅ [CRON-AUTO-CLOSE] Смена ${shift.id} успешно завершена`);

      } catch (error: any) {
        console.error(`❌ [CRON-AUTO-CLOSE] Ошибка завершения смены ${shift.id}:`, error);
        results.push({
          shiftId: shift.id,
          processorId: shift.processorId,
          processorName: shift.processor.name,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка',
          success: false
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    console.log(`🎯 [CRON-AUTO-CLOSE] Завершено: ${successCount} смен успешно, ${errorCount} с ошибками`);

    return NextResponse.json({
      message: `CRON автозакрытие завершено. Обработано смен: ${results.length}`,
      totalChecked: activeShifts.length,
      successfullyEnded: successCount,
      errors: errorCount,
      results: results,
      checkedAt: now.toISOString()
    });

  } catch (error: any) {
    console.error('❌ [CRON-AUTO-CLOSE] Критическая ошибка:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка при автозакрытии смен" },
      { status: 500 }
    );
  }
}

/**
 * Рассчитывает и логирует заработки за завершенную смену
 */
async function calculateShiftEarnings(
  processorId: string,
  shiftId: string,
  shift: { actualStart?: Date | null; actualEnd?: Date | null; shiftType: string; [key: string]: unknown }
) {
  try {
    console.log(`[CRON-EARNINGS] Расчет заработков за смену ${shiftId}`);

    // Рассчитываем часовую оплату
    if (shift.actualStart && shift.actualEnd) {
      const actualStartTime = new Date(shift.actualStart);
      const actualEndTime = new Date(shift.actualEnd);
      
      if (actualEndTime <= actualStartTime) {
        console.warn(`[CRON-EARNINGS] Некорректное время смены ${shiftId}`);
        return;
      }
      
      const shiftDurationMs = actualEndTime.getTime() - actualStartTime.getTime();
      const shiftHours = shiftDurationMs / (1000 * 60 * 60);

      // Получаем настройки зарплаты
      const salarySettings = await prisma.salary_settings.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      const hourlyRate = salarySettings?.hourlyRate || 2.0;

      if (shiftHours > 0 && shiftHours <= 24) {
        const hourlyPayment = shiftHours * hourlyRate;
        
        await SalaryLogger.logShiftHourlyPay(
          processorId,
          shiftId,
          shiftHours,
          hourlyRate,
          hourlyPayment
        );
        
        console.log(`[CRON-EARNINGS] Начислено $${hourlyPayment.toFixed(2)} за ${shiftHours.toFixed(2)} часов`);
      }
    }

    // Рассчитываем заработки от депозитов за смену
    const shiftDeposits = await prisma.processor_deposits.findMany({
      where: {
        processorId,
        createdAt: {
          gte: shift.actualStart || undefined,
          lte: shift.actualEnd || new Date(),
        },
      },
    });

    // Логируем заработки от депозитов
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

    console.log(`[CRON-EARNINGS] ✓ Расчет завершен для смены ${shiftId}`);

  } catch (error: any) {
    console.error(`[CRON-EARNINGS] Ошибка расчета заработков для смены ${shiftId}:`, error);
  }
}

// GET запрос для проверки статуса
export async function GET(request: NextRequest) {
  const now = getSystemTime();
  
  // Проверяем количество активных смен
  const activeShiftsCount = await prisma.processor_shifts.count({
    where: {
      status: 'ACTIVE'
    }
  });

  // Проверяем количество просроченных смен
  const overdueshiftsCount = await prisma.processor_shifts.count({
    where: {
      status: 'ACTIVE',
      scheduledEnd: {
        lt: new Date(now.getTime() - 30 * 60 * 1000)
      }
    }
  });

  return NextResponse.json({
    status: "CRON Auto-Close Service",
    currentTime: now.toISOString(),
    activeShifts: activeShiftsCount,
    overdueShifts: overdueshiftsCount,
    needsAction: overdueshiftsCount > 0
  });
}
