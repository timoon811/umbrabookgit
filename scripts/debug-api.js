const fetch = require('node-fetch');

async function debugAPI() {
  try {
    console.log('🔍 Отладка API депозитов...\n');
    
    const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNTY5NDRhNy04MDVlLTQ2YzctYjM2YS1hMmNlZjg2NWZjYzUiLCJlbWFpbCI6ImFkbWluQHVtYnJhLXBsYXRmb3JtLmRldiIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc1NzkzNTA1NiwiZXhwIjoxNzU4NTM5ODU2fQ.HpTkverzCks7Bc7fybajzv0qTuWWaSDF4PfSgJhPpoI";
    
    // Попробуем разные версии запроса
    const requests = [
      {
        name: 'Минимальный запрос',
        data: {
          amount: 100,
          currency: 'USDT_TRC20',
          playerEmail: 'test@example.com'
        }
      },
      {
        name: 'Полный запрос',
        data: {
          amount: 100,
          currency: 'USDT_TRC20',
          playerEmail: 'test@example.com',
          description: 'Test deposit',
          walletAddress: 'test-wallet'
        }
      }
    ];

    for (const req of requests) {
      console.log(`\n🧪 Тестируем: ${req.name}`);
      console.log('📤 Отправляем:', JSON.stringify(req.data, null, 2));
      
      try {
        const response = await fetch('http://localhost:3000/api/manager/deposits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `auth-token=${authToken}`
          },
          body: JSON.stringify(req.data)
        });

        const text = await response.text();
        console.log(`📥 Статус: ${response.status}`);
        console.log(`📥 Ответ: ${text}`);
        
        if (response.ok) {
          try {
            const json = JSON.parse(text);
            console.log(`✅ JSON распарсен успешно`);
            if (json.deposit) {
              console.log(`💰 Бонус: $${json.deposit.bonusAmount || 0}`);
            }
          } catch (e) {
            console.log(`❌ Ошибка парсинга JSON: ${e.message}`);
          }
        }
        
      } catch (error) {
        console.log(`❌ Ошибка запроса: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Общая ошибка:', error);
  }
}

debugAPI();
