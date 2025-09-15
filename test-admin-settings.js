console.log('🔧 === КОМПЛЕКСНЫЙ ТЕСТ АДМИНСКИХ НАСТРОЕК ===');

async function testAdminSettings() {
  try {
    console.log('\n📊 1. ТЕСТИРОВАНИЕ БАЗОВЫХ НАСТРОЕК ЗАРПЛАТЫ');
    
    // Получаем текущие настройки зарплаты
    const salaryResponse = await fetch('/api/admin/salary-settings', {credentials: 'include'});
    const salaryData = await salaryResponse.json();
    const originalRate = salaryData.salarySettings.hourlyRate;
    
    console.log('   📈 Текущая ставка:', originalRate, 'USD/час');
    
    // Тестируем изменение ставки
    const newRate = 3.5;
    console.log('   🔄 Изменяем ставку на:', newRate, 'USD/час');
    
    const updateSalaryResponse = await fetch('/api/admin/salary-settings', {
      method: 'PUT',
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        id: salaryData.salarySettings.id,
        name: salaryData.salarySettings.name,
        description: salaryData.salarySettings.description,
        hourlyRate: newRate,
        isActive: true
      })
    });
    
    const updatedSalary = await updateSalaryResponse.json();
    console.log('   ✅ Результат изменения ставки:', updatedSalary.hourlyRate, 'USD/час');
    
    // Проверяем сохранение
    const verifySalaryResponse = await fetch('/api/admin/salary-settings', {credentials: 'include'});
    const verifySalaryData = await verifySalaryResponse.json();
    const finalRate = verifySalaryData.salarySettings.hourlyRate;
    
    if (finalRate === newRate) {
      console.log('   ✅ ЗАРПЛАТА: Изменения сохранились!');
    } else {
      console.log('   ❌ ЗАРПЛАТА: Изменения НЕ сохранились!');
    }
    
    console.log('\n💰 2. ТЕСТИРОВАНИЕ КОМИССИИ ПЛАТФОРМЫ');
    
    // Получаем текущие настройки комиссии
    const commissionResponse = await fetch('/api/admin/platform-commission', {credentials: 'include'});
    const commissionData = await commissionResponse.json();
    const originalCommission = commissionData.commission.commissionPercent;
    
    console.log('   📊 Текущая комиссия:', originalCommission + '%');
    
    // Тестируем изменение комиссии
    const newCommission = 15;
    console.log('   🔄 Изменяем комиссию на:', newCommission + '%');
    
    const updateCommissionResponse = await fetch('/api/admin/platform-commission', {
      method: 'PUT',
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        id: commissionData.commission.id,
        name: commissionData.commission.name,
        description: commissionData.commission.description,
        commissionPercent: newCommission,
        isActive: true
      })
    });
    
    const updatedCommission = await updateCommissionResponse.json();
    console.log('   ✅ Результат изменения комиссии:', updatedCommission.commission.commissionPercent + '%');
    
    // Проверяем сохранение
    const verifyCommissionResponse = await fetch('/api/admin/platform-commission', {credentials: 'include'});
    const verifyCommissionData = await verifyCommissionResponse.json();
    const finalCommission = verifyCommissionData.commission.commissionPercent;
    
    if (finalCommission === newCommission) {
      console.log('   ✅ КОМИССИЯ: Изменения сохранились!');
    } else {
      console.log('   ❌ КОМИССИЯ: Изменения НЕ сохранились!');
    }
    
    console.log('\n🎯 3. ИТОГОВЫЙ ОТЧЕТ');
    console.log('   📈 Зарплата:', finalRate === newRate ? '✅ Работает' : '❌ Не работает');
    console.log('   💰 Комиссия:', finalCommission === newCommission ? '✅ Работает' : '❌ Не работает');
    
    if (finalRate === newRate && finalCommission === newCommission) {
      console.log('\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!');
      console.log('   Обе системы сохранения настроек работают корректно.');
    } else {
      console.log('\n⚠️  ЕСТЬ ПРОБЛЕМЫ!');
      console.log('   Требуется дополнительная диагностика.');
    }
    
  } catch (error) {
    console.error('❌ Ошибка во время тестирования:', error);
  }
}

// Запускаем тест
testAdminSettings();
