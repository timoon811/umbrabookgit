const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBonusCalculation() {
  try {
    console.log('🧪 Ручное тестирование логики расчета бонусов...\n');

    // Имитируем логику из API
    const todaySum = 600; // Пример: общая сумма депозитов за день
    
    console.log(`📊 Общая сумма депозитов за день: $${todaySum}`);
    
    // Получаем бонусную сетку
    const bonusGrid = await prisma.bonus_grid.findFirst({
      where: {
        isActive: true,
        shiftType: 'MORNING',
        minAmount: { lte: todaySum },
        OR: [
          { maxAmount: { gte: todaySum } },
          { maxAmount: null }
        ]
      },
      orderBy: { bonusPercentage: "desc" }
    });

    console.log('\n🔍 Поиск в бонусной сетке:');
    if (bonusGrid) {
      console.log(`✅ Найдена сетка: $${bonusGrid.minAmount}-${bonusGrid.maxAmount || '∞'} → ${bonusGrid.bonusPercentage}%`);
      
      const depositAmount = 100;
      const bonusAmount = (depositAmount * bonusGrid.bonusPercentage) / 100;
      
      console.log(`\n💰 Расчет для депозита $${depositAmount}:`);
      console.log(`   Процент: ${bonusGrid.bonusPercentage}%`);
      console.log(`   Бонус: $${bonusAmount.toFixed(2)}`);
    } else {
      console.log('❌ Сетка не найдена для данной суммы');
    }

    // Показываем все доступные сетки
    console.log('\n📋 Все доступные бонусные сетки:');
    const allGrids = await prisma.bonus_grid.findMany({
      where: { 
        isActive: true,
        shiftType: 'MORNING'
      },
      orderBy: { minAmount: 'asc' }
    });

    allGrids.forEach(grid => {
      console.log(`   $${grid.minAmount}-${grid.maxAmount || '∞'} → ${grid.bonusPercentage}%`);
    });

    // Тестируем разные суммы
    const testSums = [100, 500, 1000, 1500, 2000, 3000];
    
    console.log('\n🧮 Тестирование разных сумм:');
    for (const sum of testSums) {
      const grid = await prisma.bonus_grid.findFirst({
        where: {
          isActive: true,
          shiftType: 'MORNING',
          minAmount: { lte: sum },
          OR: [
            { maxAmount: { gte: sum } },
            { maxAmount: null }
          ]
        },
        orderBy: { bonusPercentage: "desc" }
      });

      if (grid) {
        const bonus = (100 * grid.bonusPercentage) / 100; // Депозит $100
        console.log(`   $${sum} общая сумма → ${grid.bonusPercentage}% → $${bonus.toFixed(2)} бонус за депозит $100`);
      } else {
        console.log(`   $${sum} общая сумма → 0% → $0.00 бонус за депозит $100`);
      }
    }

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBonusCalculation();
