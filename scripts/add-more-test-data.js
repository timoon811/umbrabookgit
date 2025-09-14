const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addMoreTestData() {
  try {
    console.log('🎯 Добавляем дополнительные тестовые данные...');

    // Находим процессора
    const processor = await prisma.users.findFirst({
      where: { role: 'PROCESSOR' }
    });

    if (!processor) {
      console.log('❌ Процессор не найден. Запустите сначала create-test-processing-data.js');
      return;
    }

    // 1. Создаем несколько депозитов на сегодня для активной смены
    console.log('💰 Добавляем депозиты на сегодня...');
    
    const today = new Date();
    const todayDeposits = [
      { amount: 245, currency: 'USDT_TRC20', email: 'today1@test.com' },
      { amount: 567, currency: 'BTC', email: 'today2@test.com' },
      { amount: 890, currency: 'ETH', email: 'today3@test.com' },
      { amount: 1250, currency: 'USDT_ERC20', email: 'today4@test.com' },
      { amount: 1750, currency: 'USDC', email: 'today5@test.com' },
      { amount: 2200, currency: 'XRP', email: 'today6@test.com' },
    ];

    for (let i = 0; i < todayDeposits.length; i++) {
      const deposit = todayDeposits[i];
      const depositTime = new Date();
      depositTime.setHours(depositTime.getHours() - (i + 1)); // Распределяем по времени

      // Рассчитываем бонус
      let bonusRate = 0.5;
      if (deposit.amount >= 3000) bonusRate = 3.0;
      else if (deposit.amount >= 2000) bonusRate = 2.5;
      else if (deposit.amount >= 1500) bonusRate = 2.0;
      else if (deposit.amount >= 1000) bonusRate = 1.5;
      else if (deposit.amount >= 500) bonusRate = 1.0;

      const bonusAmount = (deposit.amount * bonusRate) / 100;

      await prisma.processor_deposits.create({
        data: {
          processorId: processor.id,
          playerId: `today_player_${i + 1}`,
          playerNick: `TodayPlayer${i + 1}`,
          playerEmail: deposit.email,
          amount: deposit.amount,
          currency: deposit.currency,
          currencyType: deposit.currency.includes('USD') ? 'FIAT' : 'CRYPTO',
          paymentMethod: deposit.currency,
          leadSource: 'mobile_app',
          proofs: `Today proof for $${deposit.amount}`,
          notes: `Сегодняшний депозит #${i + 1}`,
          status: 'APPROVED',
          commissionRate: 30.0,
          bonusRate: bonusRate,
          bonusAmount: bonusAmount,
          createdAt: depositTime,
          updatedAt: depositTime,
        }
      });
    }
    console.log(`✅ Добавлено ${todayDeposits.length} депозитов на сегодня`);

    // 2. Создаем новую заявку на зарплату за текущий месяц
    console.log('💸 Создаем новую заявку на зарплату...');
    
    const thisMonth = new Date();
    const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
    const monthEnd = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0);

    await prisma.salary_requests.create({
      data: {
        processorId: processor.id,
        periodStart: monthStart,
        periodEnd: monthEnd,
        requestedAmount: 1200,
        calculatedAmount: 1320, // +10%
        paymentDetails: 'USDT TRC20: TXkF7P9QqG2N8VsB1mH3E...',
        comment: 'Заявка за текущий месяц',
        status: 'PENDING',
      }
    });
    console.log('✅ Создана новая заявка на зарплату');

    // 3. Добавляем бонусные настройки если их нет
    console.log('🎁 Проверяем бонусные настройки...');
    
    const existingBonusSettings = await prisma.bonus_settings.findFirst();
    if (!existingBonusSettings) {
      await prisma.bonus_settings.create({
        data: {
          name: 'Основные бонусы',
          description: 'Стандартная система бонусов для процессоров',
          baseCommissionRate: 30.0,
          baseBonusRate: 5.0,
          tiers: JSON.stringify([
            { min: 0, max: 1000, rate: 1.0 },
            { min: 1000, max: 5000, rate: 2.0 },
            { min: 5000, max: null, rate: 3.0 }
          ]),
          isActive: true,
        }
      });
      console.log('✅ Созданы базовые бонусные настройки');
    }

    // 4. Создаем несколько записей в bonus_grid
    console.log('📊 Создаем бонусную сетку...');
    
    const existingBonusGrid = await prisma.bonus_grid.findFirst();
    if (!existingBonusGrid) {
      const bonusGridData = [
        { minAmount: 0, maxAmount: 500, bonusPercentage: 1.0, description: 'Начальный уровень' },
        { minAmount: 500, maxAmount: 1500, bonusPercentage: 2.0, description: 'Средний уровень' },
        { minAmount: 1500, maxAmount: 3000, bonusPercentage: 3.0, description: 'Высокий уровень' },
        { minAmount: 3000, maxAmount: null, bonusPercentage: 5.0, description: 'Элитный уровень' },
      ];

      for (const grid of bonusGridData) {
        await prisma.bonus_grid.create({
          data: {
            shiftType: 'MORNING',
            minAmount: grid.minAmount,
            maxAmount: grid.maxAmount,
            bonusPercentage: grid.bonusPercentage,
            fixedBonus: null,
            fixedBonusMin: null,
            description: grid.description,
            isActive: true,
          }
        });
      }
      console.log('✅ Создана бонусная сетка');
    }

    // 5. Добавляем мотивации
    console.log('🚀 Создаем мотивации...');
    
    const existingMotivations = await prisma.bonus_motivations.findFirst();
    if (!existingMotivations) {
      const motivations = [
        {
          type: 'PERCENTAGE',
          name: 'Бонус за объем',
          description: 'Дополнительный процент за большой объем депозитов',
          value: 1.5,
          conditions: JSON.stringify({ minDeposits: 10, minAmount: 5000 }),
        },
        {
          type: 'FIXED_AMOUNT',
          name: 'Бонус за активность',
          description: 'Фиксированный бонус за количество депозитов',
          value: 50,
          conditions: JSON.stringify({ minDeposits: 15 }),
        },
      ];

      for (const motivation of motivations) {
        await prisma.bonus_motivations.create({
          data: {
            type: motivation.type,
            name: motivation.name,
            description: motivation.description,
            value: motivation.value,
            conditions: motivation.conditions,
            isActive: true,
          }
        });
      }
      console.log('✅ Созданы мотивации');
    }

    // 6. Добавляем еще несколько депозитов с разными статусами
    console.log('🔄 Добавляем депозиты с разными статусами...');
    
    const statusDeposits = [
      { amount: 150, status: 'PENDING', email: 'pending1@test.com' },
      { amount: 280, status: 'PENDING', email: 'pending2@test.com' },
      { amount: 420, status: 'REJECTED', email: 'rejected1@test.com' },
      { amount: 680, status: 'PROCESSING', email: 'processing1@test.com' },
    ];

    for (let i = 0; i < statusDeposits.length; i++) {
      const deposit = statusDeposits[i];
      const depositTime = new Date();
      depositTime.setMinutes(depositTime.getMinutes() - (i * 15)); // Каждые 15 минут

      await prisma.processor_deposits.create({
        data: {
          processorId: processor.id,
          playerId: `status_player_${i + 1}`,
          playerNick: `StatusPlayer${i + 1}`,
          playerEmail: deposit.email,
          amount: deposit.amount,
          currency: 'USDT_TRC20',
          currencyType: 'FIAT',
          paymentMethod: 'USDT_TRC20',
          leadSource: 'website',
          proofs: `Proof for ${deposit.status} deposit`,
          notes: `Депозит со статусом ${deposit.status}`,
          status: deposit.status,
          commissionRate: 30.0,
          bonusRate: 1.0,
          bonusAmount: deposit.amount * 0.01,
          createdAt: depositTime,
          updatedAt: depositTime,
        }
      });
    }
    console.log(`✅ Добавлено ${statusDeposits.length} депозитов с разными статусами`);

    console.log('\n🎉 Дополнительные тестовые данные успешно добавлены!');
    console.log('\n📈 Что добавлено:');
    console.log(`💰 Депозиты на сегодня: ${todayDeposits.length}`);
    console.log(`💸 Новая заявка на ЗП: 1`);
    console.log(`🎁 Бонусные настройки: проверены/созданы`);
    console.log(`📊 Бонусная сетка: проверена/создана`);
    console.log(`🚀 Мотивации: проверены/созданы`);
    console.log(`🔄 Депозиты разных статусов: ${statusDeposits.length}`);
    console.log('\n✨ Система готова к полному тестированию!');

  } catch (error) {
    console.error('❌ Ошибка при добавлении данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMoreTestData();
