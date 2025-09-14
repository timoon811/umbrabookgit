const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestProcessingData() {
  try {
    console.log('🚀 Создание тестовых данных для системы обработки...');

    // 1. Создаем тестового процессора если его нет
    console.log('👤 Проверяем/создаем тестового процессора...');
    
    let processor = await prisma.users.findFirst({
      where: { role: 'PROCESSOR' }
    });

    if (!processor) {
      const hashedPassword = await bcrypt.hash('processor123', 10);
      processor = await prisma.users.create({
        data: {
          email: 'processor@test.com',
          name: 'Тестовый Процессор',
          password: hashedPassword,
          telegram: '@test_processor',
          role: 'PROCESSOR',
          status: 'APPROVED',
          isBlocked: false,
        }
      });
      console.log('✅ Создан тестовый процессор:', processor.email);
    } else {
      console.log('✅ Найден существующий процессор:', processor.email);
    }

    // 2. Создаем настройки зарплаты если их нет
    console.log('💰 Создаем настройки зарплаты...');
    
    let salarySettings = await prisma.salary_settings.findFirst({
      where: { isActive: true }
    });

    if (!salarySettings) {
      salarySettings = await prisma.salary_settings.create({
        data: {
          name: 'Базовые настройки ЗП',
          description: 'Стандартные настройки для процессоров',
          hourlyRate: 2.5,
          isActive: true,
        }
      });
    }

    // 3. Создаем депозитную сетку
    console.log('📊 Создаем депозитную сетку...');
    
    const existingGrid = await prisma.salary_deposit_grid.findFirst();
    if (!existingGrid) {
      const depositGridData = [
        { minAmount: 0, maxAmount: 500, percentage: 0.5, description: '$0-500: 0.5%' },
        { minAmount: 500, maxAmount: 1000, percentage: 1.0, description: '$500-1000: 1.0%' },
        { minAmount: 1000, maxAmount: 1500, percentage: 1.5, description: '$1000-1500: 1.5%' },
        { minAmount: 1500, maxAmount: 2000, percentage: 2.0, description: '$1500-2000: 2.0%' },
        { minAmount: 2000, maxAmount: 3000, percentage: 2.5, description: '$2000-3000: 2.5%' },
        { minAmount: 3000, maxAmount: null, percentage: 3.0, description: '$3000+: 3.0%' },
      ];

      for (const grid of depositGridData) {
        await prisma.salary_deposit_grid.create({
          data: {
            salarySettingsId: salarySettings.id,
            minAmount: grid.minAmount,
            maxAmount: grid.maxAmount,
            percentage: grid.percentage,
            description: grid.description,
            isActive: true,
          }
        });
      }
      console.log('✅ Создана депозитная сетка');
    }

    // 4. Создаем месячные бонусы
    console.log('🎯 Создаем месячные планы...');
    
    const existingMonthly = await prisma.salary_monthly_bonus.findFirst();
    if (!existingMonthly) {
      const monthlyBonuses = [
        { name: 'Стартовый план', minAmount: 20000, bonusPercent: 2.0, description: 'Базовый уровень' },
        { name: 'Средний план', minAmount: 30000, bonusPercent: 3.0, description: 'Хороший результат' },
        { name: 'Высокий план', minAmount: 50000, bonusPercent: 5.0, description: 'Отличная работа' },
        { name: 'Элитный план', minAmount: 100000, bonusPercent: 10.0, description: 'Превосходный результат' },
      ];

      for (const bonus of monthlyBonuses) {
        await prisma.salary_monthly_bonus.create({
          data: {
            name: bonus.name,
            description: bonus.description,
            minAmount: bonus.minAmount,
            bonusPercent: bonus.bonusPercent,
            isActive: true,
          }
        });
      }
      console.log('✅ Созданы месячные планы');
    }

    // 5. Создаем смены для последних 30 дней
    console.log('⏰ Создаем тестовые смены...');
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Очищаем старые тестовые смены
    await prisma.processor_shifts.deleteMany({
      where: { processorId: processor.id }
    });

    const shiftTypes = ['MORNING', 'DAY', 'NIGHT'];
    const shifts = [];

    for (let i = 0; i < 25; i++) {
      const shiftDate = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const shiftType = shiftTypes[i % shiftTypes.length];
      
      let startHour, endHour;
      switch (shiftType) {
        case 'MORNING': startHour = 6; endHour = 14; break;
        case 'DAY': startHour = 14; endHour = 22; break;
        case 'NIGHT': startHour = 22; endHour = 6; break;
      }

      const actualStart = new Date(shiftDate);
      actualStart.setHours(startHour, 0, 0, 0);
      
      const actualEnd = new Date(shiftDate);
      if (shiftType === 'NIGHT') {
        actualEnd.setDate(actualEnd.getDate() + 1);
      }
      actualEnd.setHours(endHour, 0, 0, 0);

      const shift = await prisma.processor_shifts.create({
        data: {
          processorId: processor.id,
          shiftType: shiftType,
          shiftDate: shiftDate,
          scheduledStart: actualStart,
          scheduledEnd: actualEnd,
          actualStart: actualStart,
          actualEnd: actualEnd,
          status: 'COMPLETED',
          notes: `Тестовая ${shiftType.toLowerCase()} смена`,
        }
      });
      shifts.push(shift);
    }
    console.log(`✅ Создано ${shifts.length} тестовых смен`);

    // 6. Создаем тестовые депозиты
    console.log('💎 Создаем тестовые депозиты...');
    
    // Очищаем старые тестовые депозиты
    await prisma.processor_deposits.deleteMany({
      where: { processorId: processor.id }
    });

    const currencies = ['USDT_TRC20', 'BTC', 'ETH', 'USDT_ERC20', 'USDC', 'XRP'];
    const amounts = [150, 250, 500, 750, 1200, 1800, 2500, 3200, 4500, 6000];
    const emails = [
      'player1@example.com', 'player2@example.com', 'player3@example.com',
      'user1@test.com', 'user2@test.com', 'gamer1@email.com',
      'client1@domain.com', 'deposit@user.com'
    ];

    let totalDeposits = 0;
    for (let i = 0; i < shifts.length; i++) {
      const shift = shifts[i];
      const depositsInShift = Math.floor(Math.random() * 8) + 2; // 2-9 депозитов за смену
      
      for (let j = 0; j < depositsInShift; j++) {
        const amount = amounts[Math.floor(Math.random() * amounts.length)];
        const currency = currencies[Math.floor(Math.random() * currencies.length)];
        const email = emails[Math.floor(Math.random() * emails.length)];
        
        // Создаем депозит во время смены
        const depositTime = new Date(shift.actualStart.getTime() + 
          Math.random() * (shift.actualEnd.getTime() - shift.actualStart.getTime()));

        // Рассчитываем бонус на основе депозитной сетки
        const shiftSum = amount; // Упрощенно берем текущий депозит
        let bonusRate = 0.5; // По умолчанию
        
        if (shiftSum >= 3000) bonusRate = 3.0;
        else if (shiftSum >= 2000) bonusRate = 2.5;
        else if (shiftSum >= 1500) bonusRate = 2.0;
        else if (shiftSum >= 1000) bonusRate = 1.5;
        else if (shiftSum >= 500) bonusRate = 1.0;

        const bonusAmount = (amount * bonusRate) / 100;

        await prisma.processor_deposits.create({
          data: {
            processorId: processor.id,
            playerId: `player_${Date.now()}_${j}`,
            playerNick: `Player${Math.floor(Math.random() * 1000)}`,
            playerEmail: email,
            amount: amount,
            currency: currency,
            currencyType: currency.includes('USD') ? 'FIAT' : 'CRYPTO',
            paymentMethod: currency,
            leadSource: 'website',
            proofs: `Proof for $${amount} ${currency}`,
            notes: `Тестовый депозит #${totalDeposits + 1}`,
            status: Math.random() > 0.1 ? 'APPROVED' : 'PENDING', // 90% одобренных
            commissionRate: 30.0,
            bonusRate: bonusRate,
            bonusAmount: bonusAmount,
            createdAt: depositTime,
            updatedAt: depositTime,
          }
        });
        totalDeposits++;
      }
    }
    console.log(`✅ Создано ${totalDeposits} тестовых депозитов`);

    // 7. Создаем заявки на зарплату
    console.log('💸 Создаем заявки на зарплату...');
    
    // Очищаем старые заявки
    await prisma.salary_requests.deleteMany({
      where: { processorId: processor.id }
    });

    const salaryStatuses = ['PENDING', 'APPROVED', 'PAID'];
    const salaryAmounts = [150, 250, 350, 500, 750, 1000];

    for (let i = 0; i < 8; i++) {
      const requestDate = new Date(thirtyDaysAgo.getTime() + i * 3 * 24 * 60 * 60 * 1000);
      const amount = salaryAmounts[Math.floor(Math.random() * salaryAmounts.length)];
      const status = salaryStatuses[Math.floor(Math.random() * salaryStatuses.length)];
      
      const periodStart = new Date(requestDate);
      periodStart.setDate(1); // Начало месяца
      const periodEnd = new Date(requestDate.getFullYear(), requestDate.getMonth() + 1, 0); // Конец месяца

      await prisma.salary_requests.create({
        data: {
          processorId: processor.id,
          periodStart: periodStart,
          periodEnd: periodEnd,
          requestedAmount: amount,
          calculatedAmount: amount * 1.1, // +10% как рассчитанная сумма
          paymentDetails: 'Тестовые реквизиты',
          comment: `Заявка на выплату #${i + 1}`,
          status: status,
          createdAt: requestDate,
          updatedAt: requestDate,
        }
      });
    }
    console.log('✅ Создано 8 заявок на зарплату');

    // 8. Создаем логи действий
    console.log('📝 Создаем логи действий...');
    
    // Очищаем старые логи
    await prisma.processor_action_logs.deleteMany({
      where: { processorId: processor.id }
    });

    const actions = [
      { action: 'SHIFT_START', description: 'Начал смену' },
      { action: 'SHIFT_END', description: 'Завершил смену' },
    ];

    for (let i = 0; i < 50; i++) {
      const logDate = new Date(thirtyDaysAgo.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
      const randomAction = actions[Math.floor(Math.random() * actions.length)];

      await prisma.processor_action_logs.create({
        data: {
          processorId: processor.id,
          action: randomAction.action,
          description: randomAction.description,
          metadata: JSON.stringify({ test: true, timestamp: logDate.toISOString() }),
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Test Browser)',
          createdAt: logDate,
        }
      });
    }
    console.log('✅ Создано 50 записей в логах действий');

    // 9. Создаем текущую активную смену (если сегодня рабочий день)
    console.log('🕐 Создаем текущую смену...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingTodayShift = await prisma.processor_shifts.findFirst({
      where: {
        processorId: processor.id,
        shiftDate: today,
      }
    });

    if (!existingTodayShift) {
      const currentHour = new Date().getHours();
      let shiftType = 'MORNING';
      let startHour = 6;
      
      if (currentHour >= 14 && currentHour < 22) {
        shiftType = 'DAY';
        startHour = 14;
      } else if (currentHour >= 22 || currentHour < 6) {
        shiftType = 'NIGHT';
        startHour = 22;
      }

      const shiftStart = new Date();
      shiftStart.setHours(startHour, 0, 0, 0);
      
      await prisma.processor_shifts.create({
        data: {
          processorId: processor.id,
          shiftType: shiftType,
          shiftDate: today,
          scheduledStart: shiftStart,
          scheduledEnd: new Date(shiftStart.getTime() + 8 * 60 * 60 * 1000), // +8 часов
          actualStart: shiftStart,
          actualEnd: null,
          status: 'ACTIVE',
          notes: 'Текущая активная смена',
        }
      });
      console.log(`✅ Создана текущая ${shiftType.toLowerCase()} смена`);
    }

    console.log('\n🎉 Все тестовые данные успешно созданы!');
    console.log('\n📊 Сводка:');
    console.log(`👤 Процессор: ${processor.email}`);
    console.log(`⏰ Смен: ${shifts.length + 1} (включая текущую)`);
    console.log(`💎 Депозитов: ${totalDeposits}`);
    console.log(`💸 Заявок на ЗП: 8`);
    console.log(`📝 Записей в логах: 50`);
    console.log('\n🔗 Войдите как процессор:');
    console.log(`Email: ${processor.email}`);
    console.log(`Пароль: processor123`);
    console.log('\n✨ Теперь вы можете полноценно протестировать систему!');

  } catch (error) {
    console.error('❌ Ошибка при создании тестовых данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск скрипта
createTestProcessingData();
