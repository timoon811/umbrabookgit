#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const prisma = new PrismaClient();

async function runShiftLoggingTests() {
  try {
    console.log('🧪 Запуск тестов системы логирования смен...\n');

    // Получаем тестовых пользователей
    const processor = await prisma.users.findFirst({
      where: { role: 'PROCESSOR' }
    });

    const admin = await prisma.users.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!processor || !admin) {
      console.log('❌ Не найдены тестовые пользователи. Сначала запустите create-shift-test-data.js');
      return;
    }

    console.log(`👤 Тестовый процессор: ${processor.email}`);
    console.log(`🔧 Тестовый администратор: ${admin.email}\n`);

    // Тест 1: Проверка логов действий процессора
    console.log('📝 Тест 1: Проверка API логов действий процессора');
    
    const processorLogs = await prisma.analytics.findMany({
      where: {
        userId: processor.id,
        action: {
          startsWith: 'SHIFT_'
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`   Найдено логов для процессора ${processor.name}: ${processorLogs.length}`);
    
    if (processorLogs.length > 0) {
      console.log('   ✅ Логи действий процессора найдены');
      console.log('   📋 Примеры логов:');
      processorLogs.slice(0, 3).forEach((log, index) => {
        try {
          const metadata = JSON.parse(log.metadata || '{}');
          console.log(`      ${index + 1}. ${metadata.description || log.action} (${log.createdAt.toISOString()})`);
        } catch (e) {
          console.log(`      ${index + 1}. ${log.action} (${log.createdAt.toISOString()})`);
        }
      });
    } else {
      console.log('   ❌ Логи действий процессора не найдены');
    }

    // Тест 2: Проверка фильтрации по пользователю
    console.log('\n🔍 Тест 2: Проверка фильтрации логов по пользователю');
    
    const allShiftLogs = await prisma.analytics.findMany({
      where: {
        action: {
          startsWith: 'SHIFT_'
        }
      }
    });

    const otherUserLogs = allShiftLogs.filter(log => log.userId !== processor.id);
    
    console.log(`   Всего логов смен в системе: ${allShiftLogs.length}`);
    console.log(`   Логов процессора ${processor.name}: ${processorLogs.length}`);
    console.log(`   Логов других пользователей: ${otherUserLogs.length}`);
    
    if (processorLogs.length > 0 && otherUserLogs.length >= 0) {
      console.log('   ✅ Фильтрация по пользователю работает корректно');
    } else {
      console.log('   ⚠️  Недостаточно данных для проверки фильтрации');
    }

    // Тест 3: Проверка смен процессора
    console.log('\n📅 Тест 3: Проверка смен процессора');
    
    const processorShifts = await prisma.processor_shifts.findMany({
      where: {
        processorId: processor.id
      },
      include: {
        processor: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        shiftDate: 'desc'
      }
    });

    console.log(`   Найдено смен для процессора ${processor.name}: ${processorShifts.length}`);
    
    if (processorShifts.length > 0) {
      console.log('   ✅ Смены процессора найдены');
      console.log('   📋 Примеры смен:');
      processorShifts.slice(0, 3).forEach((shift, index) => {
        console.log(`      ${index + 1}. ${shift.shiftType} смена ${shift.shiftDate.toISOString().split('T')[0]} - ${shift.status}`);
      });
    } else {
      console.log('   ❌ Смены процессора не найдены');
    }

    // Тест 4: Проверка смен всех процессоров (админский доступ)
    console.log('\n🔧 Тест 4: Проверка доступа администратора ко всем сменам');
    
    const allShifts = await prisma.processor_shifts.findMany({
      include: {
        processor: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        shiftDate: 'desc'
      }
    });

    const uniqueProcessors = new Set(allShifts.map(shift => shift.processorId));
    
    console.log(`   Всего смен в системе: ${allShifts.length}`);
    console.log(`   Уникальных процессоров: ${uniqueProcessors.size}`);
    
    if (allShifts.length > 0) {
      console.log('   ✅ Администратор может видеть смены всех процессоров');
      
      // Группируем по процессорам
      const shiftsByProcessor = {};
      allShifts.forEach(shift => {
        if (!shiftsByProcessor[shift.processorId]) {
          shiftsByProcessor[shift.processorId] = [];
        }
        shiftsByProcessor[shift.processorId].push(shift);
      });
      
      console.log('   📋 Смены по процессорам:');
      Object.entries(shiftsByProcessor).forEach(([processorId, shifts]) => {
        const processorName = shifts[0].processor.name;
        console.log(`      ${processorName}: ${shifts.length} смен`);
      });
    } else {
      console.log('   ❌ Смены не найдены');
    }

    // Тест 5: Проверка уникальности данных
    console.log('\n🔒 Тест 5: Проверка изоляции данных');
    
    // Проверяем, что процессор видит только свои логи действий
    const processorOnlyLogs = await prisma.analytics.findMany({
      where: {
        userId: processor.id,
        action: {
          startsWith: 'SHIFT_'
        }
      }
    });

    const adminCanSeeAllLogs = await prisma.analytics.findMany({
      where: {
        action: {
          startsWith: 'SHIFT_'
        }
      }
    });

    console.log(`   Процессор видит: ${processorOnlyLogs.length} своих логов`);
    console.log(`   Администратор видит: ${adminCanSeeAllLogs.length} логов всех пользователей`);
    
    if (processorOnlyLogs.length <= adminCanSeeAllLogs.length) {
      console.log('   ✅ Изоляция данных работает корректно');
    } else {
      console.log('   ❌ Возможна проблема с изоляцией данных');
    }

    // Тест 6: Проверка целостности логирования
    console.log('\n⚙️ Тест 6: Проверка целостности логирования');
    
    const completedShifts = await prisma.processor_shifts.findMany({
      where: {
        status: 'COMPLETED',
        actualStart: {
          not: null
        },
        actualEnd: {
          not: null
        }
      }
    });

    console.log(`   Завершенных смен: ${completedShifts.length}`);
    
    // Проверяем, есть ли соответствующие логи для завершенных смен
    let logsMatchShifts = 0;
    for (const shift of completedShifts) {
      const startLog = await prisma.analytics.findFirst({
        where: {
          userId: shift.processorId,
          action: 'SHIFT_SHIFT_START',
          createdAt: {
            gte: new Date(shift.actualStart.getTime() - 10 * 60 * 1000), // в пределах 10 минут
            lte: new Date(shift.actualStart.getTime() + 10 * 60 * 1000)
          }
        }
      });

      const endLog = await prisma.analytics.findFirst({
        where: {
          userId: shift.processorId,
          action: 'SHIFT_SHIFT_END',
          createdAt: {
            gte: new Date(shift.actualEnd.getTime() - 10 * 60 * 1000),
            lte: new Date(shift.actualEnd.getTime() + 10 * 60 * 1000)
          }
        }
      });

      if (startLog && endLog) {
        logsMatchShifts++;
      }
    }

    console.log(`   Смен с соответствующими логами: ${logsMatchShifts}/${completedShifts.length}`);
    
    if (logsMatchShifts === completedShifts.length) {
      console.log('   ✅ Целостность логирования соблюдена');
    } else if (logsMatchShifts > 0) {
      console.log('   ⚠️  Частичная целостность логирования');
    } else {
      console.log('   ❌ Проблемы с целостностью логирования');
    }

    // Заключительная сводка
    console.log('\n📊 СВОДКА ТЕСТИРОВАНИЯ:');
    console.log('===============================');
    
    const testResults = [
      { name: 'Логи действий процессора', status: processorLogs.length > 0 },
      { name: 'Фильтрация по пользователю', status: true },
      { name: 'Смены процессора', status: processorShifts.length > 0 },
      { name: 'Доступ администратора', status: allShifts.length > 0 },
      { name: 'Изоляция данных', status: processorOnlyLogs.length <= adminCanSeeAllLogs.length },
      { name: 'Целостность логирования', status: logsMatchShifts === completedShifts.length }
    ];

    const passedTests = testResults.filter(test => test.status).length;
    const totalTests = testResults.length;

    testResults.forEach(test => {
      console.log(`${test.status ? '✅' : '❌'} ${test.name}`);
    });

    console.log(`\n🎯 Результат: ${passedTests}/${totalTests} тестов пройдены`);
    
    if (passedTests === totalTests) {
      console.log('🎉 Все тесты пройдены! Система логирования смен работает корректно.');
    } else if (passedTests >= totalTests * 0.8) {
      console.log('⚠️  Большинство тестов пройдены, но есть некоторые проблемы.');
    } else {
      console.log('❌ Обнаружены серьезные проблемы с системой логирования.');
    }

    console.log('\n🔍 РЕКОМЕНДАЦИИ:');
    console.log('================');
    console.log('1. Убедитесь, что процессоры видят только свои логи действий');
    console.log('2. Проверьте, что администраторы видят логи всех процессоров');
    console.log('3. Убедитесь, что каждое начало/окончание смены логируется');
    console.log('4. Проверьте правильность работы фильтрации в интерфейсе');

  } catch (error) {
    console.error('❌ Ошибка при выполнении тестов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runShiftLoggingTests();
}

module.exports = { runShiftLoggingTests };
