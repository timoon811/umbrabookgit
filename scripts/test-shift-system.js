const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Функция для получения UTC+3 времени
function getCurrentUTC3Time() {
  const now = new Date();
  // Добавляем 3 часа к UTC
  const utc3 = new Date(now.getTime() + (3 * 60 * 60 * 1000));
  return utc3;
}

async function createTestShiftData() {
  try {
    console.log('🔧 Создание тестовых данных для системы смен...');

    // Получаем всех обработчиков
    const processors = await prisma.users.findMany({
      where: { 
        role: 'PROCESSOR',
        status: 'APPROVED'
      }
    });

    if (processors.length === 0) {
      console.log('❌ Нет активных обработчиков для создания смен');
      return;
    }

    console.log(`📋 Найдено ${processors.length} обработчиков`);

    const currentTime = getCurrentUTC3Time();
    const today = new Date(currentTime);
    today.setUTCHours(6, 0, 0, 0); // Начало дня в UTC+3

    // Определяем типы смен и их время
    const shiftTypes = [
      { type: 'MORNING', startHour: 6, endHour: 14 },
      { type: 'DAY', startHour: 14, endHour: 22 },
      { type: 'NIGHT', startHour: 22, endHour: 6 } // Переходит на следующий день
    ];

    let createdShifts = 0;

    // Создаем смены для каждого обработчика на последние 7 дней
    for (let dayOffset = -7; dayOffset <= 0; dayOffset++) {
      const shiftDate = new Date(today);
      shiftDate.setUTCDate(today.getUTCDate() + dayOffset);

      for (const processor of processors) {
        // Каждый обработчик работает случайно 1-2 смены в день
        const shiftsPerDay = Math.floor(Math.random() * 2) + 1;
        const selectedShifts = shiftTypes.slice(0, shiftsPerDay);

        for (const shiftInfo of selectedShifts) {
          const scheduledStart = new Date(shiftDate);
          scheduledStart.setUTCHours(shiftInfo.startHour, 0, 0, 0);

          const scheduledEnd = new Date(shiftDate);
          if (shiftInfo.type === 'NIGHT') {
            // Ночная смена заканчивается на следующий день
            scheduledEnd.setUTCDate(shiftDate.getUTCDate() + 1);
            scheduledEnd.setUTCHours(shiftInfo.endHour, 0, 0, 0);
          } else {
            scheduledEnd.setUTCHours(shiftInfo.endHour, 0, 0, 0);
          }

          // Определяем статус смены
          let status = 'SCHEDULED';
          let actualStart = null;
          let actualEnd = null;
          let notes = null;

          // Для прошедших дней генерируем реалистичные данные
          if (dayOffset < 0) {
            const random = Math.random();
            if (random < 0.1) {
              // 10% смен пропущены
              status = 'MISSED';
            } else if (random < 0.8) {
              // 70% смен завершены
              status = 'COMPLETED';
              
              // Добавляем небольшие отклонения во времени начала и окончания
              actualStart = new Date(scheduledStart);
              actualStart.setMinutes(actualStart.getMinutes() + Math.floor(Math.random() * 10) - 5); // ±5 минут
              
              actualEnd = new Date(scheduledEnd);
              actualEnd.setMinutes(actualEnd.getMinutes() + Math.floor(Math.random() * 20) - 10); // ±10 минут
              
              const workQuality = ['Отличная работа', 'Хорошие результаты', 'Стандартная смена', 'Высокая активность'];
              notes = workQuality[Math.floor(Math.random() * workQuality.length)];
            } else {
              // 10% смен активны (для недавних дней)
              status = 'ACTIVE';
              actualStart = new Date(scheduledStart);
              actualStart.setMinutes(actualStart.getMinutes() + Math.floor(Math.random() * 10) - 5);
            }
          }
          // Для сегодняшнего дня оставляем некоторые смены запланированными

          // Проверяем, не существует ли уже такая смена
          const existingShift = await prisma.processor_shifts.findFirst({
            where: {
              processorId: processor.id,
              shiftType: shiftInfo.type,
              shiftDate: shiftDate
            }
          });

          if (!existingShift) {
            await prisma.processor_shifts.create({
              data: {
                processorId: processor.id,
                shiftType: shiftInfo.type,
                shiftDate: shiftDate,
                scheduledStart: scheduledStart,
                scheduledEnd: scheduledEnd,
                actualStart: actualStart,
                actualEnd: actualEnd,
                status: status,
                notes: notes
              }
            });

            createdShifts++;
          }
        }
      }
    }

    console.log(`✅ Создано ${createdShifts} тестовых смен`);

    // Выводим статистику
    const stats = await prisma.processor_shifts.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    console.log('\n📊 Статистика смен:');
    stats.forEach(stat => {
      const labels = {
        'SCHEDULED': 'Запланировано',
        'ACTIVE': 'Активных',
        'COMPLETED': 'Завершено',
        'MISSED': 'Пропущено'
      };
      console.log(`   ${labels[stat.status] || stat.status}: ${stat._count.id}`);
    });

  } catch (error) {
    console.error('❌ Ошибка создания тестовых данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkShiftSettings() {
  try {
    console.log('\n🔍 Проверка настроек смен...');
    
    const settings = await prisma.shift_settings.findMany();
    
    if (settings.length === 0) {
      console.log('⚠️ Настройки смен не найдены, создаем базовые настройки...');
      
      const defaultSettings = [
        {
          shiftType: 'MORNING',
          startHour: 6,
          startMinute: 0,
          endHour: 14,
          endMinute: 0,
          name: 'Утренняя смена',
          description: 'Утренняя смена с 06:00 до 14:00 МСК'
        },
        {
          shiftType: 'DAY',
          startHour: 14,
          startMinute: 0,
          endHour: 22,
          endMinute: 0,
          name: 'Дневная смена',
          description: 'Дневная смена с 14:00 до 22:00 МСК'
        },
        {
          shiftType: 'NIGHT',
          startHour: 22,
          startMinute: 0,
          endHour: 6,
          endMinute: 0,
          name: 'Ночная смена',
          description: 'Ночная смена с 22:00 до 06:00 МСК'
        }
      ];

      for (const setting of defaultSettings) {
        await prisma.shift_settings.upsert({
          where: { shiftType: setting.shiftType },
          update: setting,
          create: setting
        });
      }
      
      console.log('✅ Созданы базовые настройки смен');
    } else {
      console.log(`✅ Найдено ${settings.length} настроек смен:`);
      settings.forEach(setting => {
        console.log(`   ${setting.name}: ${setting.startHour}:${setting.startMinute.toString().padStart(2, '0')} - ${setting.endHour}:${setting.endMinute.toString().padStart(2, '0')}`);
      });
    }
  } catch (error) {
    console.error('❌ Ошибка проверки настроек смен:', error);
  }
}

async function main() {
  console.log('🚀 Тестирование системы смен...\n');
  
  await checkShiftSettings();
  await createTestShiftData();
  
  console.log('\n✅ Тестирование завершено! Теперь можно проверить логи смен в админ панели.');
  console.log('🔗 Перейдите в админ панель -> Обработка -> Смены -> Логи смен обработчиков');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createTestShiftData, checkShiftSettings };
