#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function closeHangingShifts() {
  try {
    console.log('🔧 ПРИНУДИТЕЛЬНОЕ ЗАКРЫТИЕ ЗАВИСШИХ СМЕН');
    console.log(`⏰ Запуск: ${new Date().toISOString()}\n`);

    const now = new Date();

    // Находим все активные смены, просроченные больше чем на 5 минут
    const hangingShifts = await prisma.processor_shifts.findMany({
      where: {
        status: 'ACTIVE',
        scheduledEnd: {
          lt: new Date(now.getTime() - 5 * 60 * 1000) // 5 минут назад (более агрессивное закрытие)
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

    console.log(`🔍 Найдено ${hangingShifts.length} зависших смен`);

    if (hangingShifts.length === 0) {
      console.log('✅ Зависших смен не найдено');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const shift of hangingShifts) {
      try {
        const timeSinceEnd = now.getTime() - new Date(shift.scheduledEnd).getTime();
        const minutesSinceEnd = Math.floor(timeSinceEnd / (1000 * 60));
        
        // Время закрытия - через 30 минут после планового окончания
        const autoEndTime = new Date(shift.scheduledEnd.getTime() + 30 * 60 * 1000);
        
        console.log(`📋 Закрываем смену ${shift.id}:`);
        console.log(`   👤 Процессор: ${shift.processor.name} (${shift.processor.email})`);
        console.log(`   ⏱️ Просрочена на ${minutesSinceEnd} минут`);

        // Закрываем смену
        const closedShift = await prisma.processor_shifts.update({
          where: { id: shift.id },
          data: {
            actualEnd: autoEndTime,
            status: 'COMPLETED',
            notes: (shift.notes || '') + ` [Принудительно закрыта скриптом ${new Date().toISOString()}]`,
            adminNotes: `Принудительно закрыта скриптом - просрочена на ${minutesSinceEnd} минут`
          }
        });

        // Рассчитываем заработок если была начата смена
        if (shift.actualStart) {
          const durationMs = autoEndTime.getTime() - new Date(shift.actualStart).getTime();
          const durationHours = durationMs / (1000 * 60 * 60);
          
          if (durationHours > 0 && durationHours <= 24) {
            // Получаем настройки зарплаты
            const salarySettings = await prisma.salary_settings.findFirst({
              where: { isActive: true },
              orderBy: { createdAt: 'desc' }
            });

            const hourlyRate = salarySettings?.hourlyRate || 2.0;
            const hourlyPayment = durationHours * hourlyRate;

            // Логируем заработок
            await prisma.salary_earnings_log.create({
              data: {
                processorId: shift.processorId,
                shiftId: shift.id,
                type: 'BASE_SALARY',
                description: `Автозакрытие смены ${shift.shiftType} (${durationHours.toFixed(2)}ч × $${hourlyRate})`,
                amount: hourlyPayment,
                baseAmount: hourlyPayment,
                calculationDetails: JSON.stringify({
                  hours: durationHours,
                  hourlyRate: hourlyRate,
                  shiftType: shift.shiftType,
                  forceClosed: true,
                  closedBy: 'script'
                })
              }
            });

            console.log(`   💰 Начислено $${hourlyPayment.toFixed(2)} за ${durationHours.toFixed(2)} часов`);
          }
        }

        successCount++;
        console.log(`   ✅ Смена успешно закрыта\n`);

      } catch (error) {
        errorCount++;
        console.error(`   ❌ Ошибка закрытия смены ${shift.id}:`, error.message);
      }
    }

    console.log(`📊 РЕЗУЛЬТАТ:`);
    console.log(`   ✅ Успешно закрыто: ${successCount} смен`);
    console.log(`   ❌ Ошибок: ${errorCount} смен`);
    console.log(`   ⏰ Завершено: ${new Date().toISOString()}`);

    if (successCount > 0) {
      console.log(`\n🎉 Зависшие смены успешно закрыты!`);
      console.log(`💡 Для автоматического закрытия в будущем добавьте в cron:`);
      console.log(`   */10 * * * * curl -X POST http://localhost:3000/api/cron/auto-close-shifts`);
    }

  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

closeHangingShifts();
