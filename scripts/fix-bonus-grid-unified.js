const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixBonusGridUnified() {
  try {
    console.log('🧹 Исправление дублирующихся записей бонусной сетки...\n');

    // Получаем все текущие записи
    const allGrids = await prisma.bonus_grid.findMany({
      orderBy: [{ minAmount: 'asc' }, { shiftType: 'asc' }]
    });

    console.log(`📊 Найдено записей бонусной сетки: ${allGrids.length}`);
    
    // Группируем по диапазонам
    const gridsByRange = {};
    allGrids.forEach(grid => {
      const key = `${grid.minAmount}-${grid.maxAmount || 'null'}`;
      if (!gridsByRange[key]) {
        gridsByRange[key] = [];
      }
      gridsByRange[key].push(grid);
    });

    console.log('\n🔍 Анализ дублирования:');
    for (const range in gridsByRange) {
      const grids = gridsByRange[range];
      console.log(`   ${range}: ${grids.length} записей (${grids.map(g => g.shiftType).join(', ')})`);
    }

    // Удаляем все старые записи
    console.log('\n🗑️ Удаление всех старых записей...');
    await prisma.bonus_grid.deleteMany({});
    console.log('✅ Все старые записи удалены');

    // Создаем единую бонусную сетку (без привязки к типу смены)
    console.log('\n✨ Создание единой бонусной сетки...');
    
    const unifiedBonusRules = [
      { minAmount: 0, maxAmount: 499, percentage: 0 },
      { minAmount: 500, maxAmount: 999, percentage: 0.5 },
      { minAmount: 1000, maxAmount: 1499, percentage: 1.5 },
      { minAmount: 1500, maxAmount: 1999, percentage: 2.0 },
      { minAmount: 2000, maxAmount: 2999, percentage: 2.5 },
      { minAmount: 3000, maxAmount: null, percentage: 3.0 }
    ];

    for (const rule of unifiedBonusRules) {
      await prisma.bonus_grid.create({
        data: {
          shiftType: 'MORNING', // Используем MORNING как основной тип, но логика будет игнорировать тип смены
          minAmount: rule.minAmount,
          maxAmount: rule.maxAmount,
          bonusPercentage: rule.percentage,
          description: `$${rule.minAmount}${rule.maxAmount ? `-$${rule.maxAmount}` : '+'} → ${rule.percentage}%`,
          isActive: true
        }
      });
    }

    console.log('✅ Создана единая бонусная сетка:');
    unifiedBonusRules.forEach(rule => {
      console.log(`   💰 $${rule.minAmount}${rule.maxAmount ? `-$${rule.maxAmount}` : '+'} → ${rule.percentage}%`);
    });

    // Проверяем результат
    const newGrids = await prisma.bonus_grid.findMany({
      orderBy: { minAmount: 'asc' }
    });

    console.log(`\n📊 Итого записей в новой сетке: ${newGrids.length}`);
    
    if (newGrids.length === 6) {
      console.log('\n🎉 СЕТКА ИСПРАВЛЕНА! Теперь отображается по одной записи каждого диапазона.');
    } else {
      console.log('\n⚠️ Что-то пошло не так. Ожидалось 6 записей.');
    }

  } catch (error) {
    console.error('❌ Ошибка исправления бонусной сетки:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBonusGridUnified();
