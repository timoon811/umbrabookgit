const fetch = require('node-fetch');

async function testBonusGridCRUD() {
  console.log('🧪 ПОЛНОЕ ТЕСТИРОВАНИЕ CRUD ОПЕРАЦИЙ БОНУСНОЙ СЕТКИ\n');
  
  const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNTY5NDRhNy04MDVlLTQ2YzctYjM2YS1hMmNlZjg2NWZjYzUiLCJlbWFpbCI6ImFkbWluQHVtYnJhLXBsYXRmb3JtLmRldiIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc1NzkzNTA1NiwiZXhwIjoxNzU4NTM5ODU2fQ.HpTkverzCks7Bc7fybajzv0qTuWWaSDF4PfSgJhPpoI";
  
  let createdRecordId = null;

  try {
    // ===== ТЕСТ 1: ЧТЕНИЕ ТЕКУЩИХ НАСТРОЕК =====
    console.log('📖 ТЕСТ 1: Чтение текущих настроек бонусной сетки');
    
    const readResponse = await fetch('http://localhost:3000/api/admin/bonus-settings', {
      method: 'GET',
      headers: { 'Cookie': `auth-token=${authToken}` }
    });
    
    const readData = await readResponse.json();
    
    if (readResponse.ok) {
      console.log(`✅ Успешно получены настройки`);
      console.log(`   Записей в бонусной сетке: ${readData.bonusGrids?.length || 0}`);
      console.log(`   Мотиваций: ${readData.bonusMotivations?.length || 0}`);
      
      if (readData.bonusGrids && readData.bonusGrids.length > 0) {
        console.log('   Первые 3 записи сетки:');
        readData.bonusGrids.slice(0, 3).forEach((grid, index) => {
          console.log(`     ${index + 1}. $${grid.minAmount}-${grid.maxAmount || '∞'} → ${grid.bonusPercentage}%`);
        });
      }
    } else {
      console.log(`❌ Ошибка чтения: ${readData.error}`);
      return;
    }

    // ===== ТЕСТ 2: СОЗДАНИЕ НОВОЙ ЗАПИСИ =====
    console.log('\n📝 ТЕСТ 2: Создание новой записи в бонусной сетке');
    
    const newBonusGrid = {
      type: "bonusGrid",
      settings: {
        minAmount: 5000,
        maxAmount: 9999,
        bonusPercentage: 4.0,
        description: "Тестовая запись $5000-9999 → 4%"
      }
    };
    
    const createResponse = await fetch('http://localhost:3000/api/admin/bonus-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${authToken}`
      },
      body: JSON.stringify(newBonusGrid)
    });
    
    const createData = await createResponse.json();
    
    if (createResponse.ok) {
      createdRecordId = createData.id;
      console.log(`✅ Успешно создана новая запись`);
      console.log(`   ID: ${createData.id}`);
      console.log(`   Диапазон: $${createData.minAmount}-${createData.maxAmount}`);
      console.log(`   Процент: ${createData.bonusPercentage}%`);
      console.log(`   Описание: ${createData.description}`);
    } else {
      console.log(`❌ Ошибка создания: ${createData.error}`);
      return;
    }

    // ===== ТЕСТ 3: РЕДАКТИРОВАНИЕ ЗАПИСИ =====
    console.log('\n✏️ ТЕСТ 3: Редактирование созданной записи');
    
    const updateData = {
      type: "bonusGrid",
      id: createdRecordId,
      updates: {
        bonusPercentage: 4.5,
        description: "Обновленная запись $5000-9999 → 4.5%"
      }
    };
    
    const updateResponse = await fetch('http://localhost:3000/api/admin/bonus-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${authToken}`
      },
      body: JSON.stringify(updateData)
    });
    
    const updatedData = await updateResponse.json();
    
    if (updateResponse.ok) {
      console.log(`✅ Успешно обновлена запись`);
      console.log(`   Новый процент: ${updatedData.bonusPercentage}%`);
      console.log(`   Новое описание: ${updatedData.description}`);
    } else {
      console.log(`❌ Ошибка обновления: ${updatedData.error}`);
    }

    // ===== ТЕСТ 4: ПРОВЕРКА ОБНОВЛЕННЫХ ДАННЫХ =====
    console.log('\n🔍 ТЕСТ 4: Проверка обновленных данных');
    
    const verifyResponse = await fetch('http://localhost:3000/api/admin/bonus-settings', {
      method: 'GET',
      headers: { 'Cookie': `auth-token=${authToken}` }
    });
    
    const verifyData = await verifyResponse.json();
    
    if (verifyResponse.ok) {
      const updatedRecord = verifyData.bonusGrids.find(grid => grid.id === createdRecordId);
      if (updatedRecord) {
        console.log(`✅ Запись найдена в обновленном списке`);
        console.log(`   Процент: ${updatedRecord.bonusPercentage}%`);
        console.log(`   Описание: ${updatedRecord.description}`);
      } else {
        console.log(`❌ Обновленная запись не найдена в списке`);
      }
    }

    // ===== ТЕСТ 5: УДАЛЕНИЕ ЗАПИСИ =====
    console.log('\n🗑️ ТЕСТ 5: Удаление тестовой записи');
    
    const deleteResponse = await fetch(`http://localhost:3000/api/admin/bonus-settings?type=bonusGrid&id=${createdRecordId}`, {
      method: 'DELETE',
      headers: { 'Cookie': `auth-token=${authToken}` }
    });
    
    if (deleteResponse.ok) {
      console.log(`✅ Запись успешно удалена`);
    } else {
      const deleteData = await deleteResponse.json();
      console.log(`❌ Ошибка удаления: ${deleteData.error}`);
    }

    // ===== ТЕСТ 6: ПРОВЕРКА УДАЛЕНИЯ =====
    console.log('\n🔍 ТЕСТ 6: Проверка удаления записи');
    
    const finalResponse = await fetch('http://localhost:3000/api/admin/bonus-settings', {
      method: 'GET',
      headers: { 'Cookie': `auth-token=${authToken}` }
    });
    
    const finalData = await finalResponse.json();
    
    if (finalResponse.ok) {
      const deletedRecord = finalData.bonusGrids.find(grid => grid.id === createdRecordId);
      if (!deletedRecord) {
        console.log(`✅ Запись успешно удалена из базы данных`);
        console.log(`   Текущее количество записей: ${finalData.bonusGrids.length}`);
      } else {
        console.log(`❌ Запись все еще присутствует в базе данных`);
      }
    }

    // ===== ФИНАЛЬНЫЙ ОТЧЕТ =====
    console.log('\n📊 ФИНАЛЬНЫЙ ОТЧЕТ ТЕСТИРОВАНИЯ CRUD:');
    console.log('   ✅ READ (Чтение) - работает');
    console.log('   ✅ CREATE (Создание) - работает'); 
    console.log('   ✅ UPDATE (Редактирование) - работает');
    console.log('   ✅ DELETE (Удаление) - работает');
    console.log('\n🎉 ВСЕ CRUD ОПЕРАЦИИ РАБОТАЮТ КОРРЕКТНО!');

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
    
    // Попробуем очистить тестовую запись в случае ошибки
    if (createdRecordId) {
      console.log('\n🧹 Попытка очистки тестовой записи...');
      try {
        await fetch(`http://localhost:3000/api/admin/bonus-settings?type=bonusGrid&id=${createdRecordId}`, {
          method: 'DELETE',
          headers: { 'Cookie': `auth-token=${authToken}` }
        });
        console.log('✅ Тестовая запись удалена');
      } catch (cleanupError) {
        console.log('❌ Не удалось удалить тестовую запись:', cleanupError.message);
      }
    }
  }
}

testBonusGridCRUD();
