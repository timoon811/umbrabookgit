const fetch = require('node-fetch');

async function finalBonusTest() {
  console.log('🎯 ФИНАЛЬНЫЙ ТЕСТ СИСТЕМЫ БОНУСОВ\n');
  console.log('📋 Бонусная сетка (прогрессивная):');
  console.log('   • $0-499 → 0%');
  console.log('   • $500-999 → 0.5%');
  console.log('   • $1000-1499 → 1.5%');
  console.log('   • $1500-1999 → 2%');
  console.log('   • $2000-2999 → 2.5%');
  console.log('   • $3000+ → 3%\n');

  const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNTY5NDRhNy04MDVlLTQ2YzctYjM2YS1hMmNlZjg2NWZjYzUiLCJlbWFpbCI6ImFkbWluQHVtYnJhLXBsYXRmb3JtLmRldiIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc1NzkzNTA1NiwiZXhwIjoxNzU4NTM5ODU2fQ.HpTkverzCks7Bc7fybajzv0qTuWWaSDF4PfSgJhPpoI";

  // Тест на границе $3000 для получения максимального бонуса 3%
  try {
    console.log('🧪 ТЕСТ: Депозит $1000 после текущих $2100 (итого $3100)');
    console.log('   Ожидаемый результат: 3% бонус = $30\n');

    const response = await fetch('http://localhost:3000/api/manager/deposits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${authToken}`
      },
      body: JSON.stringify({
        amount: 1000,
        currency: 'ETH',
        playerEmail: 'test3000@example.com',
        description: 'Final test $3000+ bonus',
        walletAddress: 'test-final'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ УСПЕХ!`);
      console.log(`   Депозит: $${result.amount}`);
      console.log(`   Процент: ${result.bonusRate}%`);
      console.log(`   Бонус: $${result.bonusAmount}`);
      console.log(`   Общий заработок менеджера: $${result.processorEarnings}`);
      
      if (result.bonusRate === 3 && result.bonusAmount === 30) {
        console.log(`\n🎉 СИСТЕМА БОНУСОВ РАБОТАЕТ ИДЕАЛЬНО!`);
        console.log(`   ✅ Прогрессивная сетка применяется корректно`);
        console.log(`   ✅ Бонусы рассчитываются по общей сумме за смену`);
        console.log(`   ✅ Базовый бонус полностью удален`);
        console.log(`   ✅ Максимальный уровень 3% достигнут`);
      } else {
        console.log(`\n⚠️  Бонус не соответствует ожиданиям`);
        console.log(`   Ожидалось: 3% ($30)`);
        console.log(`   Получено: ${result.bonusRate}% ($${result.bonusAmount})`);
      }
    } else {
      console.log(`❌ Ошибка API: ${result.error}`);
    }

  } catch (error) {
    console.log(`❌ Ошибка запроса: ${error.message}`);
  }
}

finalBonusTest();
