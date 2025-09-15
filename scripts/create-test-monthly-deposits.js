console.log('💰 СОЗДАНИЕ ТЕСТОВЫХ ДЕПОЗИТОВ ДЛЯ МЕСЯЧНЫХ ПЛАНОВ\n');

const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNTY5NDRhNy04MDVlLTQ2YzctYjM2YS1hMmNlZjg2NWZjYzUiLCJlbWFpbCI6ImFkbWluQHVtYnJhLXBsYXRmb3JtLmRldiIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc1NzkzNTA1NiwiZXhwIjoxNzU4NTM5ODU2fQ.HpTkverzCks7Bc7fybajzv0qTuWWaSDF4PfSgJhPpoI';

const http = require('http');
const url = require('url');

async function makeRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(`http://localhost:3000${endpoint}`);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${authToken}`
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function createTestDeposits() {
  try {
    // Проверяем текущий объем
    console.log('📊 Проверяем текущий объем депозитов...');
    const statsResponse = await makeRequest('/api/manager/stats-detailed');
    
    if (statsResponse.status !== 200) {
      console.error('❌ Ошибка получения статистики:', statsResponse.data);
      return;
    }

    const currentVolume = statsResponse.data.performance.month.volume;
    console.log(`   Текущий объем: $${currentVolume.toLocaleString()}`);

    // Планы: $20,000 (0.5%) и $30,000 (1%)
    const targetVolume = 32000; // Достигнем план 30K
    const neededVolume = Math.max(0, targetVolume - currentVolume);

    console.log(`   Цель: $${targetVolume.toLocaleString()}`);
    console.log(`   Нужно добавить: $${neededVolume.toLocaleString()}`);

    if (neededVolume <= 0) {
      console.log('✅ Планы уже достигнуты!');
      return;
    }

    // Создаем депозиты частями
    const deposits = [
      { amount: 8000, currency: 'USDT_TRC20', email: 'plan-test-1@example.com' },
      { amount: 7000, currency: 'BTC', email: 'plan-test-2@example.com' },
      { amount: 6000, currency: 'ETH', email: 'plan-test-3@example.com' },
      { amount: 5000, currency: 'USDT_ERC20', email: 'plan-test-4@example.com' },
      { amount: 3000, currency: 'LTC', email: 'plan-test-5@example.com' }
    ];

    let totalAdded = 0;
    console.log('\n💸 Создаем тестовые депозиты:');

    for (const [index, deposit] of deposits.entries()) {
      if (totalAdded >= neededVolume) break;

      const remainingNeeded = neededVolume - totalAdded;
      const actualAmount = Math.min(deposit.amount, remainingNeeded);

      const response = await makeRequest('/api/manager/deposits', 'POST', {
        amount: actualAmount,
        currency: deposit.currency,
        playerEmail: deposit.email,
        description: `Тестовый депозит для достижения месячного плана (${actualAmount})`,
        walletAddress: `test-wallet-${index + 1}`
      });

      if (response.status === 200) {
        console.log(`   ✅ Депозит ${index + 1}: $${actualAmount.toLocaleString()} (${deposit.currency})`);
        totalAdded += actualAmount;
      } else {
        console.error(`   ❌ Ошибка депозита ${index + 1}:`, response.data);
      }

      // Небольшая задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n📈 Добавлено депозитов: $${totalAdded.toLocaleString()}`);

    // Проверяем финальную статистику
    console.log('\n🔍 Проверяем обновленную статистику...');
    const finalStatsResponse = await makeRequest('/api/manager/stats-detailed');
    
    if (finalStatsResponse.status === 200) {
      const finalVolume = finalStatsResponse.data.performance.month.volume;
      console.log(`   Финальный объем: $${finalVolume.toLocaleString()}`);

      // Определяем достигнутые планы
      if (finalVolume >= 30000) {
        console.log('   🎉 Достигнут План 30K (+1% от всех депозитов)');
        console.log(`   💰 Месячный бонус: $${(finalVolume * 0.01).toFixed(2)}`);
      } else if (finalVolume >= 20000) {
        console.log('   🎉 Достигнут План 20K (+0.5% от всех депозитов)');
        console.log(`   💰 Месячный бонус: $${(finalVolume * 0.005).toFixed(2)}`);
      } else {
        console.log('   ❌ Планы не достигнуты');
      }
    }

    console.log('\n✅ Тестовые депозиты созданы!');
    console.log('\n📱 Проверьте в браузере:');
    console.log('   1. http://localhost:3000/management → Система бонусов');
    console.log('   2. Убедитесь, что месячные планы отображаются');
    console.log('   3. Проверьте прогресс-бар месячного плана');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

createTestDeposits();
