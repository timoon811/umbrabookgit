const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUnifiedBonusGrid() {
  try {
    console.log('🧪 Тестирование единой бонусной сетки...\n');

    // Проверяем количество записей в сетке
    const allGrids = await prisma.bonus_grid.findMany({
      where: { isActive: true },
      orderBy: { minAmount: 'asc' }
    });

    console.log(`📊 Всего записей в бонусной сетке: ${allGrids.length}`);
    console.log('📋 Содержимое сетки:');
    
    allGrids.forEach((grid, index) => {
      console.log(`   ${index + 1}. $${grid.minAmount}-${grid.maxAmount || '∞'} → ${grid.bonusPercentage}% (${grid.shiftType})`);
    });

    if (allGrids.length === 6) {
      console.log('\n✅ ИДЕАЛЬНО! Единая сетка содержит правильное количество записей');
    } else {
      console.log(`\n⚠️  Ожидалось 6 записей, найдено ${allGrids.length}`);
    }

    // Тестируем логику поиска для разных сумм
    console.log('\n🔍 Тестирование логики поиска бонусов:');
    
    const testSums = [100, 500, 1000, 1500, 2000, 3000, 5000];
    
    for (const sum of testSums) {
      const bonusGrid = await prisma.bonus_grid.findFirst({
        where: {
          isActive: true,
          minAmount: { lte: sum },
          OR: [
            { maxAmount: { gte: sum } },
            { maxAmount: null }
          ]
        },
        orderBy: { bonusPercentage: "desc" }
      });

      if (bonusGrid) {
        console.log(`   $${sum} → ${bonusGrid.bonusPercentage}% (диапазон: $${bonusGrid.minAmount}-${bonusGrid.maxAmount || '∞'})`);
      } else {
        console.log(`   $${sum} → 0% (сетка не найдена)`);
      }
    }

    console.log('\n🎯 Тестирование завершено! Система использует единую бонусную сетку.');

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUnifiedBonusGrid();
