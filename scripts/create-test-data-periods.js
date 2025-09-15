const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestDataForPeriods() {
  console.log('🎯 Создание тестовых данных для разных периодов');
  console.log('================================================');

  try {
    // Получаем админа
    const admin = await prisma.users.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      console.error('❌ Админ не найден');
      return;
    }

    console.log(`👤 Найден админ: ${admin.name} (${admin.email})`);

    // Очищаем старые тестовые депозиты
    await prisma.processor_deposits.deleteMany({
      where: { processorId: admin.id }
    });

    // Текущее время в UTC+3
    const utc3Now = new Date();
    utc3Now.setHours(utc3Now.getHours() + 3);
    
    console.log(`🕐 Текущее время UTC+3: ${utc3Now.toISOString()}`);

    // 1. Создаем депозиты за ВЧЕРА (для проверки что "сегодня" их не включает)
    const yesterday = new Date(utc3Now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(14, 30, 0, 0); // 14:30 вчера
    
    console.log(`📅 Создаем депозиты за вчера: ${yesterday.toISOString()}`);
    
    for (let i = 0; i < 3; i++) {
      const depositTime = new Date(yesterday);
      depositTime.setMinutes(depositTime.getMinutes() + i * 30);
      
      await prisma.processor_deposits.create({
        data: {
          processorId: admin.id,
          playerId: `test-player-yesterday-${i}`,
          playerEmail: `yesterday${i}@test.com`,
          amount: 1000 + i * 500,
          currency: 'USD',
          currencyType: 'fiat',
          commissionRate: 30,
          bonusRate: 5,
          bonusAmount: (1000 + i * 500) * 0.05,
          platformCommissionPercent: 10,
          platformCommissionAmount: (1000 + i * 500) * 0.1,
          processorEarnings: (1000 + i * 500) * 0.25,
          status: 'APPROVED',
          createdAt: depositTime
        }
      });
    }

    // 2. Создаем депозиты за СЕГОДНЯ
    const today = new Date(utc3Now);
    today.setHours(10, 0, 0, 0); // 10:00 сегодня
    
    console.log(`📅 Создаем депозиты за сегодня: ${today.toISOString()}`);
    
    for (let i = 0; i < 5; i++) {
      const depositTime = new Date(today);
      depositTime.setMinutes(depositTime.getMinutes() + i * 45);
      
      await prisma.processor_deposits.create({
        data: {
          processorId: admin.id,
          playerId: `test-player-today-${i}`,
          playerEmail: `today${i}@test.com`,
          amount: 2000 + i * 300,
          currency: 'USD',
          currencyType: 'fiat',
          commissionRate: 30,
          bonusRate: 5,
          bonusAmount: (2000 + i * 300) * 0.05,
          platformCommissionPercent: 10,
          platformCommissionAmount: (2000 + i * 300) * 0.1,
          processorEarnings: (2000 + i * 300) * 0.25,
          status: 'APPROVED',
          createdAt: depositTime
        }
      });
    }

    // 3. Создаем депозиты за ПРОШЛУЮ НЕДЕЛЮ (но не за эту)
    const lastWeek = new Date(utc3Now);
    lastWeek.setDate(lastWeek.getDate() - 8); // 8 дней назад
    lastWeek.setHours(12, 0, 0, 0);
    
    console.log(`📅 Создаем депозиты за прошлую неделю: ${lastWeek.toISOString()}`);
    
    for (let i = 0; i < 2; i++) {
      const depositTime = new Date(lastWeek);
      depositTime.setHours(depositTime.getHours() + i * 6);
      
      await prisma.processor_deposits.create({
        data: {
          processorId: admin.id,
          playerId: `test-player-lastweek-${i}`,
          playerEmail: `lastweek${i}@test.com`,
          amount: 800 + i * 400,
          currency: 'USD',
          currencyType: 'fiat',
          commissionRate: 30,
          bonusRate: 5,
          bonusAmount: (800 + i * 400) * 0.05,
          platformCommissionPercent: 10,
          platformCommissionAmount: (800 + i * 400) * 0.1,
          processorEarnings: (800 + i * 400) * 0.25,
          status: 'APPROVED',
          createdAt: depositTime
        }
      });
    }

    // 4. Создаем депозиты за ПРОШЛЫЙ МЕСЯЦ
    const lastMonth = new Date(utc3Now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setHours(15, 0, 0, 0);
    
    console.log(`📅 Создаем депозиты за прошлый месяц: ${lastMonth.toISOString()}`);
    
    for (let i = 0; i < 4; i++) {
      const depositTime = new Date(lastMonth);
      depositTime.setDate(depositTime.getDate() + i * 3);
      
      await prisma.processor_deposits.create({
        data: {
          processorId: admin.id,
          playerId: `test-player-lastmonth-${i}`,
          playerEmail: `lastmonth${i}@test.com`,
          amount: 1500 + i * 200,
          currency: 'USD',
          currencyType: 'fiat',
          commissionRate: 30,
          bonusRate: 5,
          bonusAmount: (1500 + i * 200) * 0.05,
          platformCommissionPercent: 10,
          platformCommissionAmount: (1500 + i * 200) * 0.1,
          processorEarnings: (1500 + i * 200) * 0.25,
          status: 'APPROVED',
          createdAt: depositTime
        }
      });
    }

    // 5. Создадим также тестовые смены за разные периоды
    console.log(`⏰ Создаем тестовые смены...`);

    // Удаляем старые смены
    await prisma.processor_shifts.deleteMany({
      where: { processorId: admin.id }
    });

    // Смена за вчера
    const yesterdayShift = new Date(yesterday);
    yesterdayShift.setHours(8, 0, 0, 0);
    const yesterdayShiftEnd = new Date(yesterdayShift);
    yesterdayShiftEnd.setHours(16, 0, 0, 0);

    await prisma.processor_shifts.create({
      data: {
        processorId: admin.id,
        shiftType: 'DAY',
        shiftDate: yesterdayShift,
        scheduledStart: yesterdayShift,
        scheduledEnd: yesterdayShiftEnd,
        actualStart: yesterdayShift,
        actualEnd: yesterdayShiftEnd,
        status: 'COMPLETED'
      }
    });

    // Смена за сегодня (активная)
    const todayShift = new Date(today);
    todayShift.setHours(9, 0, 0, 0);
    const todayShiftEnd = new Date(todayShift);
    todayShiftEnd.setHours(17, 0, 0, 0);

    await prisma.processor_shifts.create({
      data: {
        processorId: admin.id,
        shiftType: 'DAY',
        shiftDate: todayShift,
        scheduledStart: todayShift,
        scheduledEnd: todayShiftEnd,
        actualStart: todayShift,
        actualEnd: todayShiftEnd,
        status: 'COMPLETED'
      }
    });

    console.log('✅ Тестовые данные созданы!');
    console.log('');
    console.log('📊 Ожидаемые результаты:');
    console.log('Сегодня: 5 депозитов, ~$11,200');
    console.log('Неделя: 8 депозитов (5 сегодня + 3 вчера), ~$15,700');
    console.log('Месяц: 14 депозитов (8 за эту неделю + 2 за прошлую + 4 за прошлый месяц), ~$22,500');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestDataForPeriods();
