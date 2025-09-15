const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initializeBonusGrid() {
  try {
    console.log('🚀 Инициализация корректной бонусной сетки...');

    // Удаляем старые настройки бонусной сетки
    await prisma.bonus_grid.deleteMany({});
    console.log('🗑️ Удалены старые записи бонусной сетки');

    // Создаем правильную бонусную сетку для каждой смены
    const shiftTypes = ['MORNING', 'DAY', 'NIGHT'];
    
    const bonusRules = [
      { minAmount: 0, maxAmount: 499, percentage: 0 },      // До $500 - 0%
      { minAmount: 500, maxAmount: 999, percentage: 0.5 },   // $500-999 - 0.5%
      { minAmount: 1000, maxAmount: 1499, percentage: 1.5 }, // $1000-1499 - 1.5%
      { minAmount: 1500, maxAmount: 1999, percentage: 2.0 }, // $1500-1999 - 2%
      { minAmount: 2000, maxAmount: 2999, percentage: 2.5 }, // $2000-2999 - 2.5%
      { minAmount: 3000, maxAmount: null, percentage: 3.0 }  // $3000+ - 3%
    ];

    for (const shiftType of shiftTypes) {
      for (const rule of bonusRules) {
        await prisma.bonus_grid.create({
          data: {
            shiftType: shiftType,
            minAmount: rule.minAmount,
            maxAmount: rule.maxAmount,
            bonusPercentage: rule.percentage,
            description: `${rule.minAmount}${rule.maxAmount ? `-${rule.maxAmount}` : '+'} депозитов → ${rule.percentage}%`,
            isActive: true
          }
        });
      }
    }

    console.log('✅ Создана бонусная сетка для всех смен:');
    bonusRules.forEach(rule => {
      console.log(`   💰 $${rule.minAmount}${rule.maxAmount ? `-$${rule.maxAmount}` : '+'} → ${rule.percentage}%`);
    });

    // Проверяем результат
    const totalGrids = await prisma.bonus_grid.count();
    console.log(`\n📊 Создано ${totalGrids} записей бонусной сетки`);

    // Создаем базовые настройки бонусов (без baseBonusRate)
    await prisma.bonus_settings.deleteMany({});
    await prisma.bonus_settings.create({
      data: {
        name: 'Основные настройки',
        description: 'Настройки системы бонусов',
        baseCommissionRate: 30.0,
        tiers: JSON.stringify(bonusRules),
        isActive: true
      }
    });

    console.log('✅ Созданы базовые настройки бонусов (без базового бонуса)');

  } catch (error) {
    console.error('❌ Ошибка инициализации бонусной сетки:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initializeBonusGrid();
