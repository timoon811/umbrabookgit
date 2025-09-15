const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTodayShift() {
  try {
    // Найдем админа
    const admin = await prisma.users.findUnique({
      where: { email: 'admin@umbra-platform.dev' }
    });

    if (!admin) {
      console.error('Админ не найден');
      process.exit(1);
    }

    console.log('👤 Найден админ:', admin.name, admin.email);

    // Создаем смену на сегодня (последние 4 часа)
    const now = new Date();
    const start = new Date(now.getTime() - 4 * 60 * 60 * 1000); // 4 часа назад
    const end = new Date(now.getTime() - 30 * 60 * 1000);       // 30 минут назад

    console.log('\n⏰ Создаем сегодняшнюю смену:');
    console.log('  Начало:', start.toISOString());
    console.log('  Конец:', end.toISOString());
    console.log('  Продолжительность: 3.5 часа');

    // Создаем новую смену на сегодня
    const todayShift = await prisma.processor_shifts.create({
      data: {
        processorId: admin.id,
        shiftType: 'DAY',
        shiftDate: now,
        scheduledStart: start,
        scheduledEnd: end,
        actualStart: start,
        actualEnd: end,
        status: 'COMPLETED',
        notes: 'Сегодняшняя смена для проверки метрик'
      }
    });

    console.log('\n✅ Сегодняшняя смена создана:', todayShift.id);

    // Проверяем расчет заработка
    const durationMs = end - start;
    const durationHours = durationMs / (1000 * 60 * 60);
    const earnings = durationHours * 2; // $2/час

    console.log('\n💰 Расчет заработка:');
    console.log('  Часы:', durationHours.toFixed(2));
    console.log('  Заработок ($2/час):', earnings.toFixed(2));

    console.log('\n🎯 Сегодняшняя смена готова для тестирования метрик!');
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTodayShift();
