const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initShiftSettings() {
  try {
    console.log('🕐 Инициализация настроек смен...');

    // Проверяем, есть ли уже настройки
    const existingSettings = await prisma.shift_settings.findMany();
    
    if (existingSettings.length > 0) {
      console.log('✅ Настройки смен уже существуют');
      
      // Показываем текущие настройки
      console.log('\n📋 Текущие настройки смен:');
      existingSettings.forEach(setting => {
        const status = setting.isActive ? '✅ Активна' : '❌ Отключена';
        const timeRange = `${setting.startHour.toString().padStart(2, '0')}:${setting.startMinute.toString().padStart(2, '0')} - ${(setting.endHour >= 24 ? setting.endHour - 24 : setting.endHour).toString().padStart(2, '0')}:${setting.endMinute.toString().padStart(2, '0')}${setting.endHour >= 24 ? ' (+1 день)' : ''}`;
        console.log(`  ${setting.shiftType}: ${timeRange} - ${status}`);
        console.log(`    Название: ${setting.name || 'Не указано'}`);
        console.log(`    Описание: ${setting.description || 'Не указано'}`);
      });
      
      return;
    }

    // Создаем базовые настройки смен
    const defaultShifts = [
      {
        shiftType: 'MORNING',
        startHour: 6,
        startMinute: 0,
        endHour: 14,
        endMinute: 0,
        timezone: '+3',
        isActive: true,
        name: 'Утренняя смена',
        description: 'Утренняя смена с 06:00 до 14:00 по UTC+3'
      },
      {
        shiftType: 'DAY',
        startHour: 14,
        startMinute: 0,
        endHour: 22,
        endMinute: 0,
        timezone: '+3',
        isActive: true,
        name: 'Дневная смена',
        description: 'Дневная смена с 14:00 до 22:00 по UTC+3'
      },
      {
        shiftType: 'NIGHT',
        startHour: 22,
        startMinute: 0,
        endHour: 30, // 6:00 следующего дня
        endMinute: 0,
        timezone: '+3',
        isActive: true,
        name: 'Ночная смена',
        description: 'Ночная смена с 22:00 до 06:00 (+1 день) по UTC+3'
      }
    ];

    console.log('📝 Создание настроек смен...');
    
    for (const shift of defaultShifts) {
      await prisma.shift_settings.create({
        data: shift
      });
      
      const timeRange = `${shift.startHour.toString().padStart(2, '0')}:${shift.startMinute.toString().padStart(2, '0')} - ${(shift.endHour >= 24 ? shift.endHour - 24 : shift.endHour).toString().padStart(2, '0')}:${shift.endMinute.toString().padStart(2, '0')}${shift.endHour >= 24 ? ' (+1 день)' : ''}`;
      console.log(`  ✅ ${shift.shiftType}: ${timeRange}`);
    }

    console.log('\n🎉 Настройки смен успешно созданы!');
    console.log('\n📋 Созданные смены:');
    console.log('  🌅 Утренняя: 06:00 - 14:00');
    console.log('  ☀️ Дневная:  14:00 - 22:00');
    console.log('  🌙 Ночная:   22:00 - 06:00 (+1 день)');
    console.log('\n💡 Все смены активны по умолчанию.');
    console.log('   Администратор может отключить ненужные смены в админ панели.');
    console.log('\n🔧 Теперь процессоры смогут создавать только разрешенные смены!');

  } catch (error) {
    console.error('❌ Ошибка при инициализации настроек смен:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск скрипта
initShiftSettings();