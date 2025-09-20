const { PrismaClient } = require('@prisma/client');

require('dotenv').config({ path: '../.env.local' });

const prisma = new PrismaClient();

async function autoCloseShifts() {
  try {
    console.log('🔄 АВТОМАТИЧЕСКОЕ ЗАКРЫТИЕ СМЕН');
    console.log(`⏰ Запуск: ${new Date().toISOString()}\n`);

    // Симулируем вызов API для автозакрытия смен
    const fetch = (await import('node-fetch')).default;
    
    // Создаем административный токен (если нужен)
    const adminUser = await prisma.users.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.error('❌ Админ пользователь не найден');
      return;
    }

    console.log(`👤 Найден админ: ${adminUser.name} (${adminUser.email})`);

    // Сначала проверим, есть ли зависшие смены
    const now = new Date();
    const activeShifts = await prisma.processor_shifts.findMany({
      where: {
        status: 'ACTIVE',
        scheduledEnd: {
          lt: new Date(now.getTime() - 30 * 60 * 1000) // Больше 30 минут после окончания
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

    console.log(`🔍 Найдено ${activeShifts.length} смен для автозакрытия`);

    if (activeShifts.length === 0) {
      console.log('✅ Зависших смен не найдено - автозакрытие не требуется');
      return;
    }

    // Показываем список смен для закрытия
    for (const shift of activeShifts) {
      const timeSinceEnd = now.getTime() - new Date(shift.scheduledEnd).getTime();
      const hoursSinceEnd = timeSinceEnd / (1000 * 60 * 60);
      
      console.log(`📋 Смена ${shift.id}:`);
      console.log(`   👤 ${shift.processor.name} (${shift.processor.email})`);
      console.log(`   ⏱️ Просрочена на ${hoursSinceEnd.toFixed(1)} часов`);
    }

    console.log('\n🔧 Выполняем автозакрытие смен...');

    // Автозакрытие смен через прямое обновление БД (без API)
    const results = [];

    for (const shift of activeShifts) {
      try {
        const thirtyMinutesAfterEnd = new Date(shift.scheduledEnd.getTime() + 30 * 60 * 1000);
        
        // Обновляем смену
        const closedShift = await prisma.processor_shifts.update({
          where: { id: shift.id },
          data: {
            actualEnd: thirtyMinutesAfterEnd,
            status: 'COMPLETED',
            notes: (shift.notes || '') + ' [Автозавершена cron-скриптом через 30 мин после окончания]'
          }
        });

        console.log(`✅ Смена ${shift.id} закрыта (${shift.processor.name})`);

        // Рассчитываем заработок за смену
        if (shift.actualStart) {
          const durationMs = thirtyMinutesAfterEnd.getTime() - new Date(shift.actualStart).getTime();
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
                earningType: 'HOURLY_PAY',
                amount: hourlyPayment,
                currency: 'USD',
                details: {
                  hours: durationHours,
                  hourlyRate: hourlyRate,
                  shiftType: shift.shiftType,
                  autoCompleted: true
                }
              }
            });

            console.log(`   💰 Начислено $${hourlyPayment.toFixed(2)} за ${durationHours.toFixed(2)} часов`);
          }
        }

        results.push({
          shiftId: shift.id,
          processorName: shift.processor.name,
          success: true
        });

      } catch (error) {
        console.error(`❌ Ошибка закрытия смены ${shift.id}:`, error.message);
        results.push({
          shiftId: shift.id,
          processorName: shift.processor.name,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    console.log(`\n📊 РЕЗУЛЬТАТ:`);
    console.log(`   ✅ Успешно закрыто: ${successCount} смен`);
    console.log(`   ❌ Ошибок: ${errorCount} смен`);
    console.log(`   ⏰ Завершено: ${new Date().toISOString()}`);

  } catch (error) {
    console.error('❌ Критическая ошибка автозакрытия смен:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Если запущен напрямую
if (require.main === module) {
  autoCloseShifts();
}

module.exports = { autoCloseShifts };
