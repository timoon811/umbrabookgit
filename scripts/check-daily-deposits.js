const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function getCurrentUTC3Time() {
  const now = new Date();
  return new Date(now.getTime() + 3 * 60 * 60 * 1000);
}

function getCurrentDayStartUTC3() {
  const utc3Now = getCurrentUTC3Time();
  utc3Now.setHours(0, 0, 0, 0);
  return new Date(utc3Now.getTime() - 3 * 60 * 60 * 1000);
}

async function checkDailyDeposits() {
  try {
    console.log('📅 Проверка депозитов за сегодня...\n');
    
    const adminId = "056944a7-805e-46c7-b36a-a2cef865fcc5";
    const todayStart = getCurrentDayStartUTC3();
    
    console.log(`🕐 Начало дня UTC+3: ${todayStart.toISOString()}`);
    console.log(`🕐 Текущее время UTC+3: ${getCurrentUTC3Time().toISOString()}\n`);
    
    // Получаем все депозиты за день
    const todayDeposits = await prisma.processor_deposits.findMany({
      where: {
        processorId: adminId,
        createdAt: {
          gte: todayStart,
        },
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Найдено депозитов за день: ${todayDeposits.length}\n`);
    
    let totalAmount = 0;
    let totalBonus = 0;
    
    todayDeposits.forEach((deposit, index) => {
      totalAmount += deposit.amount;
      totalBonus += deposit.bonusAmount;
      
      console.log(`${index + 1}. $${deposit.amount} ${deposit.currency} → ${deposit.bonusRate}% → $${deposit.bonusAmount} бонус`);
      console.log(`   Общая сумма к этому моменту: $${totalAmount}`);
      console.log(`   Email: ${deposit.playerEmail}`);
      console.log(`   Время: ${deposit.createdAt.toISOString()}\n`);
    });
    
    console.log(`💰 ИТОГО:`);
    console.log(`   Сумма депозитов: $${totalAmount}`);
    console.log(`   Общий бонус: $${totalBonus}`);
    
    // Проверим, какую сетку должен применить следующий депозит
    console.log(`\n🔍 Сетка для следующего депозита (общая сумма $${totalAmount}):`);
    
    const nextBonusGrid = await prisma.bonus_grid.findFirst({
      where: {
        isActive: true,
        shiftType: 'MORNING',
        minAmount: { lte: totalAmount },
        OR: [
          { maxAmount: { gte: totalAmount } },
          { maxAmount: null }
        ]
      },
      orderBy: { bonusPercentage: "desc" }
    });

    if (nextBonusGrid) {
      console.log(`   → Следующий депозит будет получать ${nextBonusGrid.bonusPercentage}% бонус`);
      console.log(`   → Диапазон: $${nextBonusGrid.minAmount}-${nextBonusGrid.maxAmount || '∞'}`);
    } else {
      console.log(`   → Сетка не найдена, следующий депозит получит 0% бонус`);
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDailyDeposits();
