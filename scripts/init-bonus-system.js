const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initBonusSystem() {
  try {
    console.log('🚀 Инициализация бонусной системы...');

    // Создаем базовые настройки
    const baseSettings = await prisma.bonus_settings.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        name: 'Основные настройки бонусов',
        description: 'Базовые настройки комиссий и бонусов для всех пользователей',
        baseCommissionRate: 30.0,
        baseBonusRate: 5.0,
        tiers: 'progressive',
        isActive: true,
      },
    });

    console.log('✅ Базовые настройки созданы:', baseSettings.name);

    // Создаем бонусную сетку
    const bonusGrids = await Promise.all([
      prisma.bonus_grid.upsert({
        where: { id: 'grid-1' },
        update: {},
        create: {
          id: 'grid-1',
          minAmount: 0,
          maxAmount: 1000,
          bonusPercentage: 5.0,
          description: 'Базовая ставка для небольших депозитов',
          isActive: true,
        },
      }),
      prisma.bonus_grid.upsert({
        where: { id: 'grid-2' },
        update: {},
        create: {
          id: 'grid-2',
          minAmount: 1000,
          maxAmount: 5000,
          bonusPercentage: 7.5,
          description: 'Повышенная ставка для средних депозитов',
          isActive: true,
        },
      }),
      prisma.bonus_grid.upsert({
        where: { id: 'grid-3' },
        update: {},
        create: {
          id: 'grid-3',
          minAmount: 5000,
          maxAmount: null,
          bonusPercentage: 10.0,
          description: 'Максимальная ставка для крупных депозитов',
          isActive: true,
        },
      }),
    ]);

    console.log('✅ Бонусная сетка создана:', bonusGrids.length, 'ступеней');

    // Создаем дополнительные мотивации
    const motivations = await Promise.all([
      prisma.bonus_motivations.upsert({
        where: { id: 'motivation-1' },
        update: {},
        create: {
          id: 'motivation-1',
          type: 'PERCENTAGE',
          name: 'Бонус за 100 депозитов',
          description: 'Дополнительный бонус за достижение цели в 100 депозитов',
          value: 2.0,
          conditions: '{"minDeposits": 100}',
          isActive: true,
        },
      }),
      prisma.bonus_motivations.upsert({
        where: { id: 'motivation-2' },
        update: {},
        create: {
          id: 'motivation-2',
          type: 'FIXED_AMOUNT',
          name: 'Бонус за высокий объем',
          description: 'Фиксированный бонус за дневной объем $10,000+',
          value: 50.0,
          conditions: '{"minDailyAmount": 10000}',
          isActive: true,
        },
      }),
      prisma.bonus_motivations.upsert({
        where: { id: 'motivation-3' },
        update: {},
        create: {
          id: 'motivation-3',
          type: 'PERCENTAGE',
          name: 'Бонус за стабильность',
          description: 'Дополнительный бонус за 7 дней подряд',
          value: 1.0,
          conditions: '{"consecutiveDays": 7}',
          isActive: true,
        },
      }),
    ]);

    console.log('✅ Мотивации созданы:', motivations.length, 'шт.');

    // Создаем примеры инструкций
    const instructions = await Promise.all([
      prisma.processing_instructions.upsert({
        where: { id: 'instruction-1' },
        update: {},
        create: {
          id: 'instruction-1',
          title: 'Основные правила работы с депозитами',
          content: 'Все депозиты автоматически одобряются системой. Бонусы начисляются сразу после подтверждения транзакции.',
          category: 'rules',
          priority: 5,
          isActive: true,
          isPublic: true,
        },
      }),
      prisma.processing_instructions.upsert({
        where: { id: 'instruction-2' },
        update: {},
        create: {
          id: 'instruction-2',
          title: 'Как рассчитываются бонусы',
          content: 'Бонусы рассчитываются по прогрессивной сетке в зависимости от дневного объема депозитов.',
          category: 'faq',
          priority: 4,
          isActive: true,
          isPublic: true,
        },
      }),
    ]);

    console.log('✅ Инструкции созданы:', instructions.length, 'шт.');

    // Создаем примеры скриптов
    const scripts = await Promise.all([
      prisma.processing_scripts.upsert({
        where: { id: 'script-1' },
        update: {},
        create: {
          id: 'script-1',
          title: 'Приветствие клиента',
          content: 'Здравствуйте! Я готов помочь вам с депозитом. Какую сумму вы хотели бы внести?',
          description: 'Стандартное приветствие для новых клиентов',
          category: 'greeting',
          language: 'ru',
          isActive: true,
          isPublic: true,
          usageCount: 0,
        },
      }),
      prisma.processing_scripts.upsert({
        where: { id: 'script-2' },
        update: {},
        create: {
          id: 'script-2',
          title: 'Подтверждение депозита',
          content: 'Отлично! Ваш депозит на сумму ${amount} успешно обработан. Бонус ${bonus} будет начислен автоматически.',
          description: 'Скрипт подтверждения успешного депозита',
          category: 'confirmation',
          language: 'ru',
          isActive: true,
          isPublic: true,
          usageCount: 0,
        },
      }),
    ]);

    console.log('✅ Скрипты созданы:', scripts.length, 'шт.');

    console.log('🎉 Бонусная система успешно инициализирована!');
    console.log('');
    console.log('📊 Создано:');
    console.log(`   - Базовые настройки: ${baseSettings.name}`);
    console.log(`   - Ступеней бонусной сетки: ${bonusGrids.length}`);
    console.log(`   - Мотиваций: ${motivations.length}`);
    console.log(`   - Инструкций: ${instructions.length}`);
    console.log(`   - Скриптов: ${scripts.length}`);

  } catch (error) {
    console.error('❌ Ошибка инициализации бонусной системы:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initBonusSystem();
