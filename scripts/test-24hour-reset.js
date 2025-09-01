const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test24HourReset() {
  try {
    console.log('🧪 Тестирование логики 24-часового сброса...\n');

    // Получаем текущее время
    const now = new Date();
    const utcNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    
    // Сбрасываем на начало дня по UTC (00:00:00)
    const todayStart = new Date(utcNow);
    todayStart.setUTCHours(0, 0, 0, 0);
    
    // Конец дня по UTC (23:59:59.999)
    const todayEnd = new Date(utcNow);
    todayEnd.setUTCHours(23, 59, 59, 999);
    
    console.log('📅 Временные параметры:');
    console.log(`   - Локальное время: ${now.toLocaleString()}`);
    console.log(`   - UTC время: ${utcNow.toISOString()}`);
    console.log(`   - Начало дня UTC: ${todayStart.toISOString()}`);
    console.log(`   - Конец дня UTC: ${todayEnd.toISOString()}`);
    console.log(`   - Разница от начала дня: ${Math.floor((utcNow - todayStart) / (1000 * 60 * 60))} часов ${Math.floor(((utcNow - todayStart) % (1000 * 60 * 60)) / (1000 * 60))} минут`);
    
    // Проверяем корректность 24-часового сброса
    const resetHour = todayStart.getUTCHours();
    const resetMinute = todayStart.getUTCMinutes();
    const resetSecond = todayStart.getUTCSeconds();
    
    const isValidReset = resetHour === 0 && resetMinute === 0 && resetSecond === 0;
    console.log(`\n🕐 Проверка 24-часового сброса:`);
    console.log(`   - Сброс в ${resetHour}:${resetMinute}:${resetSecond} UTC - ${isValidReset ? '✅ Корректно' : '❌ Некорректно'}`);
    
    // Тестируем расчет для разных временных зон
    console.log('\n🌍 Тест для разных временных зон:');
    const timeZones = [
      { name: 'UTC', offset: 0 },
      { name: 'Москва (UTC+3)', offset: 3 },
      { name: 'Нью-Йорк (UTC-5)', offset: -5 },
      { name: 'Токио (UTC+9)', offset: 9 }
    ];
    
    timeZones.forEach(tz => {
      const tzTime = new Date(utcNow.getTime() + (tz.offset * 60 * 60 * 1000));
      const tzDayStart = new Date(tzTime);
      tzDayStart.setHours(0, 0, 0, 0);
      
      console.log(`   - ${tz.name}: ${tzTime.toLocaleString()} (начало дня: ${tzDayStart.toLocaleString()})`);
    });
    
    // Проверяем бонусную сетку
    console.log('\n💰 Проверка бонусной сетки:');
    const bonusGrids = await prisma.bonus_grid.findMany({
      where: { isActive: true },
      orderBy: { minAmount: 'asc' }
    });
    
    if (bonusGrids.length > 0) {
      console.log('   - Найдено активных сеток:', bonusGrids.length);
      bonusGrids.forEach((grid, index) => {
        console.log(`     ${index + 1}. $${grid.minAmount} - ${grid.maxAmount ? `$${grid.maxAmount}` : '∞'} = ${grid.bonusPercentage}%`);
      });
    } else {
      console.log('   - Бонусные сетки не найдены');
    }
    
    // Тестируем расчет бонусов для разных сумм
    console.log('\n🧮 Тест расчета бонусов:');
    const testAmounts = [100, 500, 1000, 2000, 5000];
    
    testAmounts.forEach(amount => {
      let bonusRate = 5.0; // базовая ставка
      
      // Находим подходящую сетку
      const applicableGrid = bonusGrids.find(grid => 
        amount >= grid.minAmount && (!grid.maxAmount || amount <= grid.maxAmount)
      );
      
      if (applicableGrid) {
        bonusRate = applicableGrid.bonusPercentage;
      }
      
      const bonusAmount = (amount * bonusRate) / 100;
      console.log(`   - Депозит $${amount}: ${bonusRate}% = $${bonusAmount.toFixed(2)}`);
    });
    
    // Проверяем настройки бонусов
    console.log('\n⚙️ Настройки бонусной системы:');
    const bonusSettings = await prisma.bonus_settings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    
    if (bonusSettings) {
      console.log(`   - Базовая комиссия: ${bonusSettings.baseCommissionRate}%`);
      console.log(`   - Базовый бонус: ${bonusSettings.baseBonusRate}%`);
      console.log(`   - Название: ${bonusSettings.name}`);
      if (bonusSettings.description) {
        console.log(`   - Описание: ${bonusSettings.description}`);
      }
    } else {
      console.log('   - Настройки бонусов не найдены');
    }
    
    // Проверяем дополнительные мотивации
    console.log('\n🎯 Дополнительные мотивации:');
    const motivations = await prisma.bonus_motivations.findMany({
      where: { isActive: true }
    });
    
    if (motivations.length > 0) {
      console.log('   - Найдено активных мотиваций:', motivations.length);
      motivations.forEach((motivation, index) => {
        console.log(`     ${index + 1}. ${motivation.name}: ${motivation.type === 'PERCENTAGE' ? `${motivation.value}%` : `$${motivation.value}`}`);
        if (motivation.description) {
          console.log(`        ${motivation.description}`);
        }
        if (motivation.conditions) {
          console.log(`        Условия: ${motivation.conditions}`);
        }
      });
    } else {
      console.log('   - Дополнительные мотивации не найдены');
    }
    
    console.log('\n✅ Тестирование завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем тест
test24HourReset();
