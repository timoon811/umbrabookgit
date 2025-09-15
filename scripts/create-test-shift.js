const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestShift() {
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

    // Создаем смену с нормальной продолжительностью (8 часов)
    const now = new Date();
    const start = new Date(now.getTime() - 8 * 60 * 60 * 1000); // 8 часов назад
    const end = new Date(now.getTime() - 1 * 60 * 60 * 1000);   // 1 час назад

    console.log('\n⏰ Создаем смену:');
    console.log('  Начало:', start.toISOString());
    console.log('  Конец:', end.toISOString());
    console.log('  Продолжительность: 7 часов');

    // Завершаем текущую смену, если она есть
    await prisma.processor_shifts.updateMany({
      where: {
        processorId: admin.id,
        status: 'ACTIVE'
      },
      data: {
        status: 'COMPLETED',
        actualEnd: new Date()
      }
    });

    // Создаем новую тестовую смену
    const testShift = await prisma.processor_shifts.create({
      data: {
        processorId: admin.id,
        shiftType: 'DAY',
        shiftDate: start,
        scheduledStart: start,
        scheduledEnd: end,
        actualStart: start,
        actualEnd: end,
        status: 'COMPLETED',
        notes: 'Тестовая смена для проверки метрик'
      }
    });

    console.log('\n✅ Смена создана:', testShift.id);

    // Проверяем расчет заработка
    const durationMs = end - start;
    const durationHours = durationMs / (1000 * 60 * 60);
    const earnings = durationHours * 2; // $2/час

    console.log('\n💰 Расчет заработка:');
    console.log('  Часы:', durationHours.toFixed(2));
    console.log('  Заработок ($2/час):', earnings.toFixed(2));

    console.log('\n🎯 Смена готова для тестирования метрик!');
    
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestShift();
