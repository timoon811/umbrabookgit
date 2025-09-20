import { prisma } from '@/lib/prisma';
import { getSystemTime } from '@/lib/system-time';
import { ProcessorLogger } from '@/lib/processor-logger';
import { SalaryLogger } from '@/lib/salary-logger';

/**
 * Автоматическое закрытие просроченных смен
 * Вызывается при каждом обращении к API смен
 */
export class ShiftAutoCloser {
  private static lastCheck: Date | null = null;
  private static readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 минут между проверками

  /**
   * Проверяет и закрывает просроченные смены
   * Работает с дебаунсингом для избежания чрезмерных проверок
   */
  static async checkAndCloseOverdueShifts(): Promise<void> {
    const now = getSystemTime();

    // Дебаунсинг: проверяем не чаще раза в 5 минут
    if (this.lastCheck && (now.getTime() - this.lastCheck.getTime()) < this.CHECK_INTERVAL) {
      return;
    }

    this.lastCheck = now;

    try {
      console.log(`🔄 [AUTO-CLOSER] Проверка просроченных смен: ${now.toISOString()}`);

      // Находим активные смены, просроченные больше чем на 30 минут
      const overdueShifts = await prisma.processor_shifts.findMany({
        where: {
          status: 'ACTIVE',
          scheduledEnd: {
            lt: new Date(now.getTime() - 30 * 60 * 1000) // 30 минут назад
          }
        },
        include: {
          processor: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      if (overdueShifts.length === 0) {
        console.log(`✅ [AUTO-CLOSER] Просроченных смен не найдено`);
        return;
      }

      console.log(`⚠️ [AUTO-CLOSER] Найдено ${overdueShifts.length} просроченных смен для автозакрытия`);

      let successCount = 0;
      let errorCount = 0;

      for (const shift of overdueShifts) {
        try {
          await this.closeOverdueShift(shift);
          successCount++;
          console.log(`✅ [AUTO-CLOSER] Смена ${shift.id} автоматически закрыта (${shift.processor.name})`);
        } catch (error) {
          errorCount++;
          console.error(`❌ [AUTO-CLOSER] Ошибка закрытия смены ${shift.id}:`, error);
        }
      }

      console.log(`🎯 [AUTO-CLOSER] Результат: ${successCount} успешно, ${errorCount} ошибок`);

    } catch (error) {
      console.error('❌ [AUTO-CLOSER] Критическая ошибка при проверке смен:', error);
    }
  }

  /**
   * Закрывает конкретную просроченную смену
   */
  private static async closeOverdueShift(shift: any): Promise<void> {
    const autoEndTime = new Date(shift.scheduledEnd.getTime() + 30 * 60 * 1000); // +30 минут к плановому окончанию
    
    // Обновляем смену
    const closedShift = await prisma.processor_shifts.update({
      where: { id: shift.id },
      data: {
        actualEnd: autoEndTime,
        status: 'COMPLETED',
        notes: (shift.notes || '') + ' [Автозавершена системой через 30 мин после окончания]',
        adminNotes: `Автозакрыта ${getSystemTime().toISOString()} - смена просрочена более чем на 30 минут`
      }
    });

    // Рассчитываем и логируем заработки
    await this.calculateShiftEarnings(shift.processorId, shift.id, closedShift);

    // Логируем событие закрытия смены (попытка - если ProcessorLogger недоступен, игнорируем)
    try {
      await ProcessorLogger.logShiftEnd(
        shift.processorId,
        shift.shiftType,
        autoEndTime.getTime() - new Date(shift.actualStart).getTime(),
        null, // Нет request объекта
        true // автозавершение
      );
    } catch (logError) {
      // Игнорируем ошибки логирования - не критично
      console.warn(`⚠️ [AUTO-CLOSER] Не удалось записать лог для смены ${shift.id}`);
    }
  }

  /**
   * Рассчитывает заработки за автозакрытую смену
   */
  private static async calculateShiftEarnings(
    processorId: string,
    shiftId: string,
    shift: any
  ): Promise<void> {
    try {
      // Часовая оплата
      if (shift.actualStart && shift.actualEnd) {
        const startTime = new Date(shift.actualStart);
        const endTime = new Date(shift.actualEnd);
        
        if (endTime > startTime) {
          const durationMs = endTime.getTime() - startTime.getTime();
          const durationHours = durationMs / (1000 * 60 * 60);
          
          if (durationHours > 0 && durationHours <= 24) {
            // Получаем текущие настройки зарплаты
            const salarySettings = await prisma.salary_settings.findFirst({
              where: { isActive: true },
              orderBy: { createdAt: 'desc' }
            });
            
            const hourlyRate = salarySettings?.hourlyRate || 2.0;
            const hourlyPayment = durationHours * hourlyRate;
            
            // Логируем заработок за часы
            await SalaryLogger.logShiftHourlyPay(
              processorId,
              shiftId,
              durationHours,
              hourlyRate,
              hourlyPayment
            );
          }
        }
      }

      // Заработки от депозитов (если есть)
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

    } catch (error) {
      console.error(`❌ [AUTO-CLOSER] Ошибка расчета заработков для смены ${shiftId}:`, error);
    }
  }

  /**
   * Принудительная проверка без дебаунсинга (для админских операций)
   */
  static async forceCheck(): Promise<{ closed: number; errors: number }> {
    this.lastCheck = null; // Сбрасываем дебаунсинг
    await this.checkAndCloseOverdueShifts();
    
    // Возвращаем результат последней проверки
    const overdueCount = await prisma.processor_shifts.count({
      where: {
        status: 'ACTIVE',
        scheduledEnd: {
          lt: new Date(getSystemTime().getTime() - 30 * 60 * 1000)
        }
      }
    });

    return { closed: 0, errors: overdueCount }; // Примерная статистика
  }
}
