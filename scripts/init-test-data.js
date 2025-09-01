const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🚀 Инициализация тестовых данных...');

    // Создаем настройки бонусов если их нет
    const bonusSettings = await prisma.bonus_settings.findFirst({
      where: { isActive: true }
    });

    if (!bonusSettings) {
      await prisma.bonus_settings.create({
        data: {
          name: 'Стандартные настройки',
          description: 'Базовые настройки для начисления бонусов',
          baseCommissionRate: 30.0,
          baseBonusRate: 5.0,
          tiers: JSON.stringify([
            { minAmount: 0, maxAmount: 1000, rate: 5.0 },
            { minAmount: 1000, maxAmount: 5000, rate: 7.5 },
            { minAmount: 5000, maxAmount: null, rate: 10.0 }
          ]),
          isActive: true
        }
      });
      console.log('✅ Настройки бонусов созданы');
    } else {
      console.log('ℹ️ Настройки бонусов уже существуют');
    }

    console.log('✅ Тестовые данные готовы');
  } catch (error) {
    console.error('❌ Ошибка создания тестовых данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
