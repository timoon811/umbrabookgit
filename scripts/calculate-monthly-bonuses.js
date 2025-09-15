const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function calculateMonthlyBonuses() {
  try {
    console.log('💰 РАСЧЕТ МЕСЯЧНЫХ БОНУСОВ\n');

    // Получаем активные месячные планы
    const monthlyPlans = await prisma.salary_monthly_bonus.findMany({
      where: { isActive: true },
      orderBy: { minAmount: 'desc' } // От большего к меньшему для правильного расчета
    });

    if (monthlyPlans.length === 0) {
      console.log('❌ Месячные планы не найдены');
      return;
    }

    console.log('📋 АКТИВНЫЕ ПЛАНЫ:');
    monthlyPlans.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.name}: $${plan.minAmount.toLocaleString()} → +${plan.bonusPercent}%`);
    });

    // Получаем всех активных менеджеров
    const managers = await prisma.users.findMany({
      where: { 
        role: 'PROCESSOR',
        status: 'APPROVED'
      }
    });

    console.log(`\n👥 Найдено ${managers.length} активных менеджеров`);

    // Текущий месяц
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    console.log(`📅 Период: ${startOfMonth.toISOString().split('T')[0]} - ${endOfMonth.toISOString().split('T')[0]}`);

    const results = [];

    for (const manager of managers) {
      // Получаем все депозиты менеджера за месяц
      const deposits = await prisma.processor_deposits.findMany({
        where: {
          processorId: manager.id,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      const totalMonthlyVolume = deposits.reduce((sum, deposit) => sum + deposit.amount, 0);

      // Определяем подходящий план (наибольший достигнутый)
      let applicablePlan = null;
      for (const plan of monthlyPlans) {
        if (totalMonthlyVolume >= plan.minAmount) {
          applicablePlan = plan;
          break; // Берем первый подходящий (самый высокий)
        }
      }

      const monthlyBonusAmount = applicablePlan 
        ? (totalMonthlyVolume * applicablePlan.bonusPercent / 100)
        : 0;

      results.push({
        manager,
        totalMonthlyVolume,
        applicablePlan,
        monthlyBonusAmount,
        depositsCount: deposits.length
      });
    }

    console.log('\n📊 РЕЗУЛЬТАТЫ РАСЧЕТА:');
    console.log('═'.repeat(80));

    results.forEach((result, index) => {
      const { manager, totalMonthlyVolume, applicablePlan, monthlyBonusAmount, depositsCount } = result;
      
      console.log(`${index + 1}. ${manager.name} (${manager.email})`);
      console.log(`   📈 Объем депозитов: $${totalMonthlyVolume.toLocaleString()} (${depositsCount} депозитов)`);
      
      if (applicablePlan) {
        console.log(`   ✅ Достигнут план: ${applicablePlan.name}`);
        console.log(`   💰 Месячный бонус: $${monthlyBonusAmount.toFixed(2)} (+${applicablePlan.bonusPercent}%)`);
      } else {
        console.log(`   ❌ Планы не достигнуты`);
        console.log(`   💰 Месячный бонус: $0.00`);
        
        // Показываем ближайший план
        const nextPlan = monthlyPlans[monthlyPlans.length - 1]; // Самый маленький план
        if (nextPlan) {
          const remaining = nextPlan.minAmount - totalMonthlyVolume;
          console.log(`   🎯 До плана "${nextPlan.name}": $${remaining.toLocaleString()}`);
        }
      }
      console.log('');
    });

    // Сводка
    const totalBonusesAmount = results.reduce((sum, r) => sum + r.monthlyBonusAmount, 0);
    const managersWithBonuses = results.filter(r => r.monthlyBonusAmount > 0).length;

    console.log('📋 СВОДКА:');
    console.log(`   👥 Менеджеров с бонусами: ${managersWithBonuses} из ${results.length}`);
    console.log(`   💰 Общая сумма месячных бонусов: $${totalBonusesAmount.toFixed(2)}`);

    // Демонстрация логики
    console.log('\n🧮 ПРИМЕРЫ ЛОГИКИ:');
    console.log('   📈 Прогрессивная система (НЕ накопительная):');
    console.log('   • $25,000 депозитов → План 20K (0.5%) = $125');
    console.log('   • $35,000 депозитов → План 30K (1.0%) = $350 (НЕ $125 + $175)');
    console.log('   • $15,000 депозитов → Нет планов = $0');

    return results;

  } catch (error) {
    console.error('❌ Ошибка расчета месячных бонусов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Экспортируем функцию для использования в других скриптах
if (require.main === module) {
  calculateMonthlyBonuses();
}

module.exports = { calculateMonthlyBonuses };
