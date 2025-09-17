import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";
import { getCurrentUTC3Time } from "@/lib/time-utils";
import { ProcessorLogger } from "@/lib/processor-logger";
import { SalaryLogger } from "@/lib/salary-logger";

/**
 * Административный endpoint для автозавершения просроченных смен всех пользователей
 * Может вызываться периодически системой или администратором
 */
export async function POST(request: NextRequest) {
  try {
    // Проверяем административные права (только для cron или админа)
      const authResult = await requireAdminAuth(request);
      
        if ('error' in authResult) {
        return authResult.error;
      }
    
      
        const { user } = authResult;
    
        const now = getCurrentUTC3Time();
        console.log(`🔄 [AUTO-END] Запуск проверки автозавершения смен в ${now.toISOString()}`);
    
        // Находим все активные смены, которые должны быть завершены
        const activeShifts = await prisma.processor_shifts.findMany({
          where: {
            status: 'ACTIVE',
            scheduledEnd: {
              lt: new Date(now.getTime() - 30 * 60 * 1000) // Прошло больше 30 минут после окончания
            }
          },
          include: {
            processor: true
          }
        });
    
        console.log(`🔍 [AUTO-END] Найдено ${activeShifts.length} смен для автозавершения`);
    
        const results = [];
    
        for (const shift of activeShifts) {
          try {
            const thirtyMinutesAfterEnd = new Date(shift.scheduledEnd!.getTime() + 30 * 60 * 1000);
            
            console.log(`⏰ [AUTO-END] Завершаем смену ${shift.id} пользователя ${shift.processor.name} (${shift.processor.email})`);
    
            // Автоматически завершаем смену
            const autoEndedShift = await prisma.processor_shifts.update({
              where: { id: shift.id },
              data: {
                actualEnd: thirtyMinutesAfterEnd,
                status: 'COMPLETED',
                notes: (shift.notes || '') + ' [Автозавершена системой через 30 мин после окончания]'
              }
            });
    
            // Логируем автозавершение
            await ProcessorLogger.logShiftEnd(
              shift.processorId,
              shift.shiftType,
              thirtyMinutesAfterEnd.getTime() - new Date(shift.actualStart!).getTime(),
              request,
              true // автозавершение
            );
    
            // Рассчитываем и логируем все заработки за автозавершенную смену
            await calculateAndLogShiftEarnings(shift.processorId, shift.id, autoEndedShift);
    
            results.push({
              shiftId: shift.id,
              processorId: shift.processorId,
              processorName: shift.processor.name,
              shiftType: shift.shiftType,
              autoEndedAt: thirtyMinutesAfterEnd.toISOString(),
              success: true
            });
    
            console.log(`✅ [AUTO-END] Смена ${shift.id} успешно завершена`);
    
          
  } catch (error: any) {
        console.error(`❌ [AUTO-END] Ошибка завершения смены ${shift.id}:`, error);
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

    console.log(`🎯 [AUTO-END] Завершено: ${successCount} смен успешно, ${errorCount} с ошибками`);

    return NextResponse.json({
      message: `Проверка автозавершения завершена. Обработано смен: ${results.length}`,
      totalChecked: activeShifts.length,
      successfullyEnded: successCount,
      errors: errorCount,
      results: results,
      checkedAt: now.toISOString()
    });

  } catch (error: any) {
    console.error('❌ [AUTO-END] Ошибка проверки автозавершения смен:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера при проверке автозавершения смен" },
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
        console.warn(`[SHIFT_EARNINGS] Некорректное время админ-автозавершенной смены ${shiftId}: конец (${actualEndTime.toISOString()}) раньше или равен началу (${actualStartTime.toISOString()})`);
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
        console.log(`[SHIFT_EARNINGS] Начислено ${hourlyPayment}$ за ${shiftHours.toFixed(2)} часов админ-автозавершенной смены`);
      } else {
        console.warn(`[SHIFT_EARNINGS] Некорректная продолжительность админ-автозавершенной смены: ${shiftHours.toFixed(2)} часов`);
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

  } catch (error: any) {
    console.error(`[SHIFT_EARNINGS] ERROR: Ошибка при расчете заработков за автозавершенную смену ${shiftId}:`, error);
    // Не прерываем завершение смены из-за ошибок в логировании
  }
}