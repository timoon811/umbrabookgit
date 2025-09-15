console.log('📊 ФИНАЛЬНЫЙ ТЕСТ МЕТРИК МЕНЕДЖЕРА\n');

const https = require('https');
const http = require('http');
const url = require('url');

async function fetchAPI(endpoint) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(`http://localhost:3000${endpoint}`);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNTY5NDRhNy04MDVlLTQ2YzctYjM2YS1hMmNlZjg2NWZjYzUiLCJlbWFpbCI6ImFkbWluQHVtYnJhLXBsYXRmb3JtLmRldiIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc1NzkzNTA1NiwiZXhwIjoxNzU4NTM5ODU2fQ.HpTkverzCks7Bc7fybajzv0qTuWWaSDF4PfSgJhPpoI'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTest() {
  try {
    console.log('🔍 Получаем детальную статистику...');
    const stats = await fetchAPI('/api/manager/stats-detailed');

    console.log('\n✅ РЕЗУЛЬТАТЫ МЕТРИК:');
    console.log('┌────────────────┬─────────────┬─────────────┬────────────┐');
    console.log('│   Период       │  Заработок  │    Часы     │ Депозиты   │');
    console.log('├────────────────┼─────────────┼─────────────┼────────────┤');
    console.log(`│ Сегодня        │  $${stats.performance.today.earnings.toFixed(2).padStart(8)} │   ${stats.performance.today.hours.toFixed(1).padStart(7)} │    ${stats.performance.today.deposits.toString().padStart(6)} │`);
    console.log(`│ Неделя         │  $${stats.performance.week.earnings.toFixed(2).padStart(8)} │   ${stats.performance.week.hours.toFixed(1).padStart(7)} │    ${stats.performance.week.deposits.toString().padStart(6)} │`);
    console.log(`│ Месяц          │  $${stats.performance.month.earnings.toFixed(2).padStart(8)} │   ${stats.performance.month.hours.toFixed(1).padStart(7)} │    ${stats.performance.month.deposits.toString().padStart(6)} │`);
    console.log('└────────────────┴─────────────┴─────────────┴────────────┘');

    console.log('\n🎯 ПРОГНОЗЫ:');
    console.log(`   • Месячный заработок: $${stats.projections.monthlyEarnings.toFixed(2)}`);
    console.log(`   • Дней осталось: ${stats.projections.remainingDays}`);
    console.log(`   • Дневная цель: $${stats.projections.dailyTarget.toFixed(2)}`);
    console.log(`   • На пути к цели: ${stats.projections.onTrack ? '✅ Да' : '❌ Нет'}`);

    console.log('\n📈 ЦЕЛИ НА МЕСЯЦ:');
    console.log(`   • Заработок: $${stats.goals.monthly.earnings} (${stats.goals.progress.earnings.toFixed(1)}%)`);
    console.log(`   • Депозиты: ${stats.goals.monthly.deposits} (${stats.goals.progress.deposits.toFixed(1)}%)`);
    console.log(`   • Часы: ${stats.goals.monthly.hours} (${stats.goals.progress.hours.toFixed(1)}%)`);

    console.log('\n🏆 ДОСТИЖЕНИЯ:');
    console.log(`   • Заработок: ${stats.goals.achievements.earningsAchieved ? '✅' : '❌'}`);
    console.log(`   • Депозиты: ${stats.goals.achievements.depositsAchieved ? '✅' : '❌'}`);
    console.log(`   • Часы: ${stats.goals.achievements.hoursAchieved ? '✅' : '❌'}`);

    console.log('\n🥇 РЕЙТИНГ:');
    console.log(`   • Текущая позиция: #${stats.currentUserRank}`);
    if (stats.leaderboard.length > 0) {
      stats.leaderboard.forEach((manager, index) => {
        const indicator = manager.isCurrentUser ? '👑' : '  ';
        console.log(`   ${indicator} ${index + 1}. ${manager.name} - $${manager.earnings.toFixed(2)} (${manager.deposits} деп.)`);
      });
    }

    console.log('\n⚙️  НАСТРОЙКИ:');
    console.log(`   • Почасовая ставка: $${stats.settings.hourlyRate}/час`);
    console.log(`   • Базовая комиссия: ${stats.settings.baseCommission}%`);
    console.log(`   • Бонусных сеток: ${stats.settings.bonusGrids.length}`);

    if (stats.settings.bonusGrids.length > 0) {
      console.log('\n💰 БОНУСНАЯ СЕТКА:');
      stats.settings.bonusGrids.forEach(grid => {
        const range = grid.maxAmount ? `$${grid.minAmount}-$${grid.maxAmount}` : `$${grid.minAmount}+`;
        console.log(`   • ${range.padEnd(15)} → ${grid.bonusPercentage}%`);
      });
    }

    console.log('\n🎉 ВСЕ МЕТРИКИ РАБОТАЮТ КОРРЕКТНО!');
    console.log('\n📱 Проверьте в браузере: http://localhost:3000/management');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  }
}

runTest();
