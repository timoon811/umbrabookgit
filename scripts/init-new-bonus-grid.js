const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initNewBonusGrid() {
  try {
    console.log('🚀 Инициализация новой бонусной сетки по требованиям...\n');

    // Очищаем старую сетку
    await prisma.bonus_grid.deleteMany({});
    console.log('✅ Старая бонусная сетка очищена');

    // Создаем новую сетку для утренней смены (06:00-14:00 UTC+3)
    console.log('🌅 Создание сетки для утренней смены:');
    const morningGrids = [
      {
        shiftType: 'MORNING',
        minAmount: 0,
        maxAmount: 350,
        bonusPercentage: 0,
        description: 'Утренняя смена: < 350$ — 0%',
        isActive: true,
      },
      {
        shiftType: 'MORNING',
        minAmount: 351,
        maxAmount: 690,
        bonusPercentage: 5,
        description: 'Утренняя смена: 351$–690$ — 5%',
        isActive: true,
      },
      {
        shiftType: 'MORNING',
        minAmount: 691,
        maxAmount: 920,
        bonusPercentage: 7,
        description: 'Утренняя смена: 691$–920$ — 7%',
        isActive: true,
      },
      {
        shiftType: 'MORNING',
        minAmount: 921,
        maxAmount: 1250,
        bonusPercentage: 9,
        description: 'Утренняя смена: 921$–1250$ — 9%',
        isActive: true,
      },
      {
        shiftType: 'MORNING',
        minAmount: 1250,
        maxAmount: null,
        bonusPercentage: 10,
        description: 'Утренняя смена: ≥ 1250$ — 10%',
        isActive: true,
      },
    ];

    for (const grid of morningGrids) {
      await prisma.bonus_grid.create({ data: grid });
      console.log(`   ✅ ${grid.description}`);
    }

    // Создаем новую сетку для дневной/ночной смены (14:00-22:00, 22:00-06:00 UTC+3)
    console.log('\n☀️ Создание сетки для дневной/ночной смены:');
    const dayNightGrids = [
      {
        shiftType: 'DAY',
        minAmount: 0,
        maxAmount: 500,
        bonusPercentage: 0,
        description: 'Дневная/Ночная смена: < 500$ — 0%',
        isActive: true,
      },
      {
        shiftType: 'DAY',
        minAmount: 500,
        maxAmount: 1100,
        bonusPercentage: 5,
        description: 'Дневная/Ночная смена: 500$–1100$ — 5%',
        isActive: true,
      },
      {
        shiftType: 'DAY',
        minAmount: 1101,
        maxAmount: 1500,
        bonusPercentage: 7,
        description: 'Дневная/Ночная смена: 1101$–1500$ — 7%',
        isActive: true,
      },
      {
        shiftType: 'DAY',
        minAmount: 1501,
        maxAmount: 2000,
        bonusPercentage: 9,
        description: 'Дневная/Ночная смена: 1501$–2000$ — 9%',
        isActive: true,
      },
      {
        shiftType: 'DAY',
        minAmount: 2000,
        maxAmount: null,
        bonusPercentage: 10,
        description: 'Дневная/Ночная смена: ≥ 2000$ — 10%',
        isActive: true,
      },
      // Повторяем для NIGHT смены
      {
        shiftType: 'NIGHT',
        minAmount: 0,
        maxAmount: 500,
        bonusPercentage: 0,
        description: 'Ночная смена: < 500$ — 0%',
        isActive: true,
      },
      {
        shiftType: 'NIGHT',
        minAmount: 500,
        maxAmount: 1100,
        bonusPercentage: 5,
        description: 'Ночная смена: 500$–1100$ — 5%',
        isActive: true,
      },
      {
        shiftType: 'NIGHT',
        minAmount: 1101,
        maxAmount: 1500,
        bonusPercentage: 7,
        description: 'Ночная смена: 1101$–1500$ — 7%',
        isActive: true,
      },
      {
        shiftType: 'NIGHT',
        minAmount: 1501,
        maxAmount: 2000,
        bonusPercentage: 9,
        description: 'Ночная смена: 1501$–2000$ — 9%',
        isActive: true,
      },
      {
        shiftType: 'NIGHT',
        minAmount: 2000,
        maxAmount: null,
        bonusPercentage: 10,
        description: 'Ночная смена: ≥ 2000$ — 10%',
        isActive: true,
      },
    ];

    for (const grid of dayNightGrids) {
      await prisma.bonus_grid.create({ data: grid });
      console.log(`   ✅ ${grid.description}`);
    }

    // Добавляем фиксированные бонусы - создаем отдельные записи
    console.log('\n🎯 Добавление фиксированных бонусов:');

    // Для утренней смены - создаем отдельные записи для фиксированных бонусов
    const morningFixedBonuses = [
      {
        shiftType: 'MORNING',
        minAmount: 800,
        maxAmount: 800,
        bonusPercentage: 0, // Не процентный бонус
        fixedBonus: 25,
        fixedBonusMin: 800,
        description: 'Утренняя смена: 800$ → +25$ фиксированный бонус',
        isActive: true,
      },
      {
        shiftType: 'MORNING',
        minAmount: 1200,
        maxAmount: 1200,
        bonusPercentage: 0,
        fixedBonus: 35,
        fixedBonusMin: 1200,
        description: 'Утренняя смена: 1200$ → +35$ фиксированный бонус',
        isActive: true,
      },
      {
        shiftType: 'MORNING',
        minAmount: 1500,
        maxAmount: 1500,
        bonusPercentage: 0,
        fixedBonus: 50,
        fixedBonusMin: 1500,
        description: 'Утренняя смена: 1500$ → +50$ фиксированный бонус',
        isActive: true,
      },
    ];

    for (const bonus of morningFixedBonuses) {
      await prisma.bonus_grid.create({ data: bonus });
      console.log(`   ✅ ${bonus.description}`);
    }

    // Для дневной смены
    const dayFixedBonuses = [
      {
        shiftType: 'DAY',
        minAmount: 1090,
        maxAmount: 1090,
        bonusPercentage: 0,
        fixedBonus: 25,
        fixedBonusMin: 1090,
        description: 'Дневная смена: 1090$ → +25$ фиксированный бонус',
        isActive: true,
      },
      {
        shiftType: 'DAY',
        minAmount: 1550,
        maxAmount: 1550,
        bonusPercentage: 0,
        fixedBonus: 35,
        fixedBonusMin: 1550,
        description: 'Дневная смена: 1550$ → +35$ фиксированный бонус',
        isActive: true,
      },
      {
        shiftType: 'DAY',
        minAmount: 2222,
        maxAmount: 2222,
        bonusPercentage: 0,
        fixedBonus: 100,
        fixedBonusMin: 2222,
        description: 'Дневная смена: 2222$ → +100$ фиксированный бонус',
        isActive: true,
      },
    ];

    for (const bonus of dayFixedBonuses) {
      await prisma.bonus_grid.create({ data: bonus });
      console.log(`   ✅ ${bonus.description}`);
    }

    // Для ночной смены
    const nightFixedBonuses = [
      {
        shiftType: 'NIGHT',
        minAmount: 1090,
        maxAmount: 1090,
        bonusPercentage: 0,
        fixedBonus: 25,
        fixedBonusMin: 1090,
        description: 'Ночная смена: 1090$ → +25$ фиксированный бонус',
        isActive: true,
      },
      {
        shiftType: 'NIGHT',
        minAmount: 1550,
        maxAmount: 1550,
        bonusPercentage: 0,
        fixedBonus: 35,
        fixedBonusMin: 1550,
        description: 'Ночная смена: 1550$ → +35$ фиксированный бонус',
        isActive: true,
      },
      {
        shiftType: 'NIGHT',
        minAmount: 2222,
        maxAmount: 2222,
        bonusPercentage: 0,
        fixedBonus: 100,
        fixedBonusMin: 2222,
        description: 'Ночная смена: 2222$ → +100$ фиксированный бонус',
        isActive: true,
      },
    ];

    for (const bonus of nightFixedBonuses) {
      await prisma.bonus_grid.create({ data: bonus });
      console.log(`   ✅ ${bonus.description}`);
    }

    console.log('\n✅ Новая бонусная сетка успешно создана!');

    // Проверяем результат
    const allGrids = await prisma.bonus_grid.findMany({
      orderBy: [
        { shiftType: 'asc' },
        { minAmount: 'asc' }
      ]
    });

    console.log('\n📊 Итоговая бонусная сетка:');
    console.log('┌─────────────┬──────────────┬─────────────┬─────────────┬─────────────────────────────┐');
    console.log('│   Смена     │ Мин. сумма   │ Макс. сумма │ Процент     │ Фиксированный бонус        │');
    console.log('├─────────────┼──────────────┼─────────────┼─────────────┼─────────────────────────────┤');

    allGrids.forEach(grid => {
      const shiftName = {
        'MORNING': '🌅 Утро',
        'DAY': '☀️ День',
        'NIGHT': '🌙 Ночь'
      }[grid.shiftType] || grid.shiftType;

      const minAmount = `$${grid.minAmount}`;
      const maxAmount = grid.maxAmount ? `$${grid.maxAmount}` : '∞';
      const percentage = `${grid.bonusPercentage}%`;
      const fixedBonus = grid.fixedBonus ? `$${grid.fixedBonus}` : '-';

      console.log(`│ ${shiftName.padEnd(11)} │ ${minAmount.padEnd(12)} │ ${maxAmount.padEnd(11)} │ ${percentage.padEnd(11)} │ ${fixedBonus.padEnd(27)} │`);
    });

    console.log('└─────────────┴──────────────┴─────────────┴─────────────┴─────────────────────────────┘');

  } catch (error) {
    console.error('❌ Ошибка инициализации бонусной сетки:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initNewBonusGrid();
