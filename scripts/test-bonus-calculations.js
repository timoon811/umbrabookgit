const fs = require('fs');

// Функция для тестирования API депозитов
async function testDepositBonus(amount, expectedBonus, description) {
  try {
    console.log(`\n🧪 ТЕСТ: ${description}`);
    console.log(`   Депозит: $${amount}`);
    console.log(`   Ожидаемый бонус: $${expectedBonus}`);
    
    // Используем тот же токен администратора
    const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNTY5NDRhNy04MDVlLTQ2YzctYjM2YS1hMmNlZjg2NWZjYzUiLCJlbWFpbCI6ImFkbWluQHVtYnJhLXBsYXRmb3JtLmRldiIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc1NzkzNTA1NiwiZXhwIjoxNzU4NTM5ODU2fQ.HpTkverzCks7Bc7fybajzv0qTuWWaSDF4PfSgJhPpoI";
    
    const response = await fetch('http://localhost:3000/api/manager/deposits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${authToken}`
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'USDT_TRC20',
        playerEmail: 'test@example.com',
        description: `Тестовый депозит $${amount}`,
        walletAddress: 'test-wallet-address'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      const actualBonus = result.deposit?.bonusAmount || 0;
      const status = Math.abs(actualBonus - expectedBonus) < 0.01 ? '✅ PASSED' : '❌ FAILED';
      
      console.log(`   Фактический бонус: $${actualBonus.toFixed(2)}`);
      console.log(`   Статус: ${status}`);
      
      if (result.todayTotal) {
        console.log(`   Общая сумма за день: $${result.todayTotal}`);
      }
      
      return {
        passed: Math.abs(actualBonus - expectedBonus) < 0.01,
        expected: expectedBonus,
        actual: actualBonus,
        todayTotal: result.todayTotal
      };
    } else {
      console.log(`   ❌ Ошибка API: ${result.error}`);
      return { passed: false, error: result.error };
    }
  } catch (error) {
    console.log(`   ❌ Ошибка сети: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

async function runBonusTests() {
  console.log('🚀 Запуск тестов расчета бонусов по сетке\n');
  console.log('📋 Бонусная сетка:');
  console.log('   • $0-499 → 0%');
  console.log('   • $500-999 → 0.5%');
  console.log('   • $1000-1499 → 1.5%');
  console.log('   • $1500-1999 → 2%');
  console.log('   • $2000-2999 → 2.5%');
  console.log('   • $3000+ → 3%');
  
  const tests = [
    // Тест 1: Депозит $100 (должен давать 0%)
    { amount: 100, expected: 0, description: 'Депозит $100 - ниже минимума $500' },
    
    // Тест 2: Депозит $500 (должен давать 0.5%)
    { amount: 500, expected: 2.5, description: 'Депозит $500 - 0.5% бонус' },
    
    // Тест 3: Депозит $1000 после предыдущих (общая сумма $1600, должно быть 2%)
    { amount: 1000, expected: 20, description: 'Депозит $1000 после $600 (общая $1600) - 2% бонус' },
    
    // Тест 4: Депозит $500 после предыдущих (общая сумма $2100, должно быть 2.5%)
    { amount: 500, expected: 12.5, description: 'Депозит $500 после $1600 (общая $2100) - 2.5% бонус' },
    
    // Тест 5: Депозит $1000 после предыдущих (общая сумма $3100, должно быть 3%)
    { amount: 1000, expected: 30, description: 'Депозит $1000 после $2100 (общая $3100) - 3% бонус' }
  ];
  
  const results = [];
  let totalPassed = 0;
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const result = await testDepositBonus(test.amount, test.expected, test.description);
    results.push(result);
    
    if (result.passed) {
      totalPassed++;
    }
    
    // Небольшая пауза между тестами
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:`);
  console.log(`   Пройдено: ${totalPassed}/${tests.length}`);
  console.log(`   Процент успеха: ${(totalPassed / tests.length * 100).toFixed(1)}%`);
  
  if (totalPassed === tests.length) {
    console.log(`\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Система бонусов работает корректно.`);
  } else {
    console.log(`\n⚠️  Некоторые тесты не прошли. Необходима проверка системы.`);
  }
}

// Добавляем fetch если его нет
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

runBonusTests();
