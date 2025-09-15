console.log('🎯 СОЗДАНИЕ ТЕСТОВЫХ ПЛАНОВ\n');

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

async function createTestGoals() {
  try {
    console.log('📋 Проверяем доступные типы планов...');
    
    const typesResponse = await makeRequest('/api/admin/goals');
    if (typesResponse.status !== 200) {
      console.error('❌ Ошибка получения типов планов:', typesResponse.data);
      return;
    }

    const { goalTypes } = typesResponse.data;
    console.log(`✅ Найдено ${goalTypes.length} типов планов:`);
    goalTypes.forEach(type => {
      console.log(`   • ${type.name} (${type.unit}) - ${type.type}`);
    });

    // Находим ID типов планов
    const earningsTypeId = goalTypes.find(t => t.type === 'EARNINGS')?.id;
    const depositsTypeId = goalTypes.find(t => t.type === 'DEPOSITS_COUNT')?.id;
    const hoursTypeId = goalTypes.find(t => t.type === 'HOURS')?.id;

    console.log('\n🏆 Создаем тестовые планы...');

    // 1. План на заработок (многоэтапный)
    const earningsGoal = {
      name: 'Недельный план заработка',
      description: 'Многоэтапные цели по заработку с фиксированными бонусами',
      goalTypeId: earningsTypeId,
      periodType: 'WEEKLY',
      stages: [
        {
          targetValue: 100,
          rewardAmount: 10,
          title: 'Старт',
          description: 'Первые $100 заработка'
        },
        {
          targetValue: 250,
          rewardAmount: 25,
          title: 'Разгон',
          description: 'Достижение $250 заработка'
        },
        {
          targetValue: 500,
          rewardAmount: 50,
          title: 'Профессионал',
          description: 'Достижение $500 заработка'
        },
        {
          targetValue: 1000,
          rewardAmount: 100,
          title: 'Мастер',
          description: 'Достижение $1000 заработка'
        }
      ]
    };

    const earningsResponse = await makeRequest('/api/admin/goals', 'POST', earningsGoal);
    if (earningsResponse.status === 201) {
      console.log('   ✅ План заработка создан');
      console.log('      • 4 этапа: $100 → $10, $250 → $25, $500 → $50, $1000 → $100');
    } else {
      console.log('   ❌ Ошибка создания плана заработка:', earningsResponse.data);
    }

    // 2. План на количество депозитов
    const depositsGoal = {
      name: 'Дневной план депозитов',
      description: 'Лесенка наград за количество обработанных депозитов',
      goalTypeId: depositsTypeId,
      periodType: 'DAILY',
      stages: [
        {
          targetValue: 10,
          rewardAmount: 5,
          title: 'Первые 10',
          description: '10 депозитов за день'
        },
        {
          targetValue: 25,
          rewardAmount: 15,
          title: 'Четверть сотни',
          description: '25 депозитов за день'
        },
        {
          targetValue: 50,
          rewardAmount: 35,
          title: 'Полтинник',
          description: '50 депозитов за день'
        },
        {
          targetValue: 100,
          rewardAmount: 75,
          title: 'Центурион',
          description: '100 депозитов за день'
        },
        {
          targetValue: 150,
          rewardAmount: 125,
          title: 'Мега-обработчик',
          description: '150 депозитов за день'
        }
      ]
    };

    const depositsResponse = await makeRequest('/api/admin/goals', 'POST', depositsGoal);
    if (depositsResponse.status === 201) {
      console.log('   ✅ План депозитов создан');
      console.log('      • 5 этапов: 10 → $5, 25 → $15, 50 → $35, 100 → $75, 150 → $125');
    } else {
      console.log('   ❌ Ошибка создания плана депозитов:', depositsResponse.data);
    }

    // 3. План на отработанные часы
    const hoursGoal = {
      name: 'Месячный план часов',
      description: 'Награды за отработанное время в месяц',
      goalTypeId: hoursTypeId,
      periodType: 'MONTHLY',
      stages: [
        {
          targetValue: 40,
          rewardAmount: 20,
          title: 'Рабочая неделя',
          description: '40 часов в месяц'
        },
        {
          targetValue: 80,
          rewardAmount: 50,
          title: 'Две недели',
          description: '80 часов в месяц'
        },
        {
          targetValue: 120,
          rewardAmount: 90,
          title: 'Три недели',
          description: '120 часов в месяц'
        },
        {
          targetValue: 160,
          rewardAmount: 150,
          title: 'Полный месяц',
          description: '160 часов в месяц'
        }
      ]
    };

    const hoursResponse = await makeRequest('/api/admin/goals', 'POST', hoursGoal);
    if (hoursResponse.status === 201) {
      console.log('   ✅ План часов создан');
      console.log('      • 4 этапа: 40ч → $20, 80ч → $50, 120ч → $90, 160ч → $150');
    } else {
      console.log('   ❌ Ошибка создания плана часов:', hoursResponse.data);
    }

    console.log('\n📊 Проверяем созданные планы...');
    
    const allGoalsResponse = await makeRequest('/api/admin/goals');
    if (allGoalsResponse.status === 200) {
      const { goals } = allGoalsResponse.data;
      console.log(`✅ Всего планов: ${goals.length}`);
      
      goals.forEach(goal => {
        console.log(`\n📋 ${goal.name} (${goal.goalTypeName})`);
        console.log(`   Период: ${goal.periodType}`);
        console.log(`   Этапы: ${goal.stages.length}`);
        
        goal.stages.forEach(stage => {
          console.log(`      ${stage.stage}. ${stage.title}: ${stage.targetValue}${goal.goalTypeUnit} → $${stage.rewardAmount}`);
        });
      });
    }

    console.log('\n🎯 ЛОГИКА РАБОТЫ МНОГОЭТАПНЫХ ПЛАНОВ:');
    console.log('   📈 Лесенка наград: каждый этап дает ДОПОЛНИТЕЛЬНУЮ награду');
    console.log('   🏆 Пример: 100 депозитов = $5 + $15 + $35 + $75 = $130 ОБЩИЙ БОНУС');
    console.log('   ⚠️  ВАЖНО: каждый этап дает свою награду при достижении');
    console.log('   🔄 Периоды: DAILY (сброс каждый день), WEEKLY (неделя), MONTHLY (месяц)');

    console.log('\n✅ ТЕСТОВЫЕ ПЛАНЫ СОЗДАНЫ УСПЕШНО!');
    console.log('\n📱 Проверьте в админ панели:');
    console.log('   1. Настройки ЗП → раздел "Планы/Цели"');
    console.log('   2. Убедитесь что все 3 плана отображаются');
    console.log('   3. Проверьте этапы каждого плана');

  } catch (error) {
    console.error('❌ Ошибка создания планов:', error);
  }
}

createTestGoals();
