const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initMonthlyPlans() {
  try {
    console.log('🎯 ИНИЦИАЛИЗАЦИЯ МЕСЯЧНЫХ ПЛАНОВ\n');

    // Удаляем существующие планы
    console.log('🗑️  Удаляем существующие планы...');
    await prisma.salary_monthly_bonus.deleteMany({});

    // Создаем новые месячные планы согласно примеру
    const monthlyPlans = [
      {
        name: 'План 20K',
        description: 'Бонус за выполнение плана 20,000$ депозитов',
        minAmount: 20000,
        bonusPercent: 0.5,
        isActive: true
      },
      {
        name: 'План 30K',
        description: 'Бонус за выполнение плана 30,000$ депозитов',
        minAmount: 30000,
        bonusPercent: 1.0,
        isActive: true
      }
    ];

    console.log('✨ Создаем новые месячные планы:');
    
    for (const plan of monthlyPlans) {
      const created = await prisma.salary_monthly_bonus.create({
        data: plan
      });
      
      console.log(`   ✅ ${plan.name}: $${plan.minAmount.toLocaleString()} → +${plan.bonusPercent}%`);
      console.log(`      ID: ${created.id}`);
    }

    console.log('\n📊 ПРОВЕРКА СОЗДАННЫХ ПЛАНОВ:');
    
    const allPlans = await prisma.salary_monthly_bonus.findMany({
      where: { isActive: true },
      orderBy: { minAmount: 'asc' }
    });

    allPlans.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.name}:`);
      console.log(`      Минимум: $${plan.minAmount.toLocaleString()}`);
      console.log(`      Бонус: +${plan.bonusPercent}% от всех депозитов`);
      console.log(`      Статус: ${plan.isActive ? 'Активен' : 'Неактивен'}`);
      console.log('');
    });

    console.log('🎯 ЛОГИКА РАБОТЫ ПЛАНОВ:');
    console.log('   📈 Прогрессивная система:');
    console.log('   • $20,000 депозитов → +0.5% от ВСЕЙ суммы депозитов');
    console.log('   • $30,000 депозитов → +1% от ВСЕЙ суммы депозитов');
    console.log('');
    console.log('   🧮 Пример расчета:');
    console.log('   • Менеджер набрал $25,000 → получает 0.5% = $125');
    console.log('   • Менеджер набрал $35,000 → получает 1% = $350');
    console.log('   (НЕ 0.5% + 0.5%, а ЗАМЕНЯЕТ предыдущий процент)');

    console.log('\n✅ Месячные планы успешно инициализированы!');
    
  } catch (error) {
    console.error('❌ Ошибка инициализации планов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initMonthlyPlans();
