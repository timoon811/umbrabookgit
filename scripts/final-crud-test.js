const fetch = require('node-fetch');

async function finalCRUDTest() {
  console.log('🎯 ФИНАЛЬНЫЙ ТЕСТ CRUD ЧЕРЕЗ ВЕБ-ИНТЕРФЕЙС\n');
  
  const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNTY5NDRhNy04MDVlLTQ2YzctYjM2YS1hMmNlZjg2NWZjYzUiLCJlbWFpbCI6ImFkbWluQHVtYnJhLXBsYXRmb3JtLmRldiIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc1NzkzNTA1NiwiZXhwIjoxNzU4NTM5ODU2fQ.HpTkverzCks7Bc7fybajzv0qTuWWaSDF4PfSgJhPpoI";

  console.log('📋 ТЕКУЩЕЕ СОСТОЯНИЕ БОНУСНОЙ СЕТКИ:');
  
  // Получаем текущее состояние
  const currentResponse = await fetch('http://localhost:3000/api/admin/bonus-settings', {
    method: 'GET',
    headers: { 'Cookie': `auth-token=${authToken}` }
  });
  
  const currentData = await currentResponse.json();
  
  if (currentData.bonusGrids) {
    console.log(`   Всего записей: ${currentData.bonusGrids.length}`);
    currentData.bonusGrids.forEach((grid, index) => {
      console.log(`   ${index + 1}. $${grid.minAmount}-${grid.maxAmount || '∞'} → ${grid.bonusPercentage}%`);
    });
  }

  console.log('\n🧪 СОЗДАНИЕ ТЕСТОВОЙ ЗАПИСИ ЧЕРЕЗ ВЕБ API:');
  
  const testRecord = {
    type: "bonusGrid",
    settings: {
      minAmount: 15000,
      maxAmount: null,
      bonusPercentage: 6.0,
      description: "VIP уровень $15000+ → 6%"
    }
  };

  const createResponse = await fetch('http://localhost:3000/api/admin/bonus-settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `auth-token=${authToken}`
    },
    body: JSON.stringify(testRecord)
  });

  const createData = await createResponse.json();
  
  if (createResponse.ok) {
    console.log(`✅ Создана тестовая запись:`);
    console.log(`   ID: ${createData.id}`);
    console.log(`   Диапазон: $${createData.minAmount}-${createData.maxAmount || '∞'}`);
    console.log(`   Процент: ${createData.bonusPercentage}%`);
    console.log(`   Описание: ${createData.description}`);
    
    console.log('\n🔄 ПРОВЕРКА ОТОБРАЖЕНИЯ В АДМИН ПАНЕЛИ:');
    console.log(`   🌐 Откройте: http://localhost:3000/admin/management`);
    console.log(`   📍 Перейдите в раздел "Настройки бонусной сетки"`);
    console.log(`   👀 Проверьте, что новая запись отображается корректно`);
    
    console.log('\n⏱️ Ожидаем 10 секунд для проверки...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('\n🗑️ УДАЛЕНИЕ ТЕСТОВОЙ ЗАПИСИ:');
    
    const deleteResponse = await fetch(`http://localhost:3000/api/admin/bonus-settings?type=bonusGrid&id=${createData.id}`, {
      method: 'DELETE',
      headers: { 'Cookie': `auth-token=${authToken}` }
    });
    
    if (deleteResponse.ok) {
      console.log(`✅ Тестовая запись удалена`);
    } else {
      console.log(`❌ Ошибка удаления тестовой записи`);
    }
    
  } else {
    console.log(`❌ Ошибка создания: ${createData.error}`);
  }

  console.log('\n📊 ИТОГОВОЕ СОСТОЯНИЕ:');
  
  const finalResponse = await fetch('http://localhost:3000/api/admin/bonus-settings', {
    method: 'GET',
    headers: { 'Cookie': `auth-token=${authToken}` }
  });
  
  const finalData = await finalResponse.json();
  
  if (finalData.bonusGrids) {
    console.log(`   Всего записей: ${finalData.bonusGrids.length}`);
    if (finalData.bonusGrids.length === 6) {
      console.log(`   ✅ Количество записей корректно (6 основных диапазонов)`);
    }
  }

  console.log('\n🎉 ФИНАЛЬНАЯ ПРОВЕРКА ЗАВЕРШЕНА!');
  console.log('\n📝 ИНСТРУКЦИИ ДЛЯ ДАЛЬНЕЙШЕГО ТЕСТИРОВАНИЯ:');
  console.log('   1. Откройте админ панель: http://localhost:3000/admin/management');
  console.log('   2. Перейдите в "Настройки бонусной сетки"');
  console.log('   3. Попробуйте:');
  console.log('      • ➕ Добавить новую запись');
  console.log('      • ✏️  Отредактировать существующую');
  console.log('      • 🗑️  Удалить запись');
  console.log('   4. Проверьте, что валидация работает:');
  console.log('      • Отрицательные числа не принимаются');
  console.log('      • Минимум не может быть больше максимума');
  console.log('      • Процент не может быть больше 100%');
}

finalCRUDTest();
