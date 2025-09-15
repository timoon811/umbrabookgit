#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🚀 Создание тестовых данных для системы логирования смен...');

    // Получаем процессоров и администраторов
    const processors = await prisma.users.findMany({
      where: {
        role: 'PROCESSOR'
      }
    });

    const admins = await prisma.users.findMany({
      where: {
        role: 'ADMIN'
      }
    });

    if (processors.length === 0) {
      console.log('❌ Не найдено процессоров в системе. Создаем тестового процессора...');
      
      const testProcessor = await prisma.users.create({
        data: {
          email: 'test-processor@example.com',
          name: 'Тестовый Процессор',
          password: '$2b$10$GRLDkbKb5F1fCaR3mF1FKO.SdvHJyF3jrKGUIU1vGJBOEGOBmfKS2', // password123
          telegram: '@test_processor',
          role: 'PROCESSOR',
          status: 'APPROVED'
        }
      });
      
      processors.push(testProcessor);
      console.log('✅ Тестовый процессор создан:', testProcessor.email);
    }

    if (admins.length === 0) {
      console.log('❌ Не найдено администраторов в системе. Создаем тестового администратора...');
      
      const testAdmin = await prisma.users.create({
        data: {
          email: 'test-admin@example.com',
          name: 'Тестовый Администратор',
          password: '$2b$10$GRLDkbKb5F1fCaR3mF1FKO.SdvHJyF3jrKGUIU1vGJBOEGOBmfKS2', // password123
          telegram: '@test_admin',
          role: 'ADMIN',
          status: 'APPROVED'
        }
      });
      
      admins.push(testAdmin);
      console.log('✅ Тестовый администратор создан:', testAdmin.email);
    }

    // Создаем настройки смен, если их нет
    const existingShiftSettings = await prisma.shift_settings.findMany();
    
    if (existingShiftSettings.length === 0) {
      console.log('🕐 Создание настроек смен...');
      
      const shiftSettings = await prisma.shift_settings.createMany({
        data: [
          {
            shiftType: 'MORNING',
            startHour: 6,
            startMinute: 0,
            endHour: 14,
            endMinute: 0,
            timezone: '+3',
            isActive: true,
            name: 'Утренняя смена',
            description: 'Утренняя смена с 06:00 до 14:00'
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
            description: 'Дневная смена с 14:00 до 22:00'
          },
          {
            shiftType: 'NIGHT',
            startHour: 22,
            startMinute: 0,
            endHour: 6,
            endMinute: 0,
            timezone: '+3',
            isActive: true,
            name: 'Ночная смена',
            description: 'Ночная смена с 22:00 до 06:00'
          }
        ]
      });
      
      console.log('✅ Настройки смен созданы');
    }

    // Получаем настройки смен
    const allShiftSettings = await prisma.shift_settings.findMany();

    // Назначаем смены процессорам
    console.log('👥 Назначение смен процессорам...');
    
    for (const processor of processors) {
      for (const shiftSetting of allShiftSettings) {
        const existingAssignment = await prisma.user_shift_assignments.findUnique({
          where: {
            userId_shiftSettingId: {
              userId: processor.id,
              shiftSettingId: shiftSetting.id
            }
          }
        });

        if (!existingAssignment) {
          await prisma.user_shift_assignments.create({
            data: {
              userId: processor.id,
              shiftSettingId: shiftSetting.id,
              assignedBy: admins[0]?.id || processor.id,
              isActive: true
            }
          });
        }
      }
    }

    // Создаем тестовые смены для процессоров
    console.log('📅 Создание тестовых смен...');
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const testShifts = [];

    for (const processor of processors.slice(0, 2)) { // Берем первых 2 процессоров
      // Вчерашняя завершенная смена
      const completedShift = {
        processorId: processor.id,
        shiftType: 'MORNING',
        shiftDate: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 6, 0, 0),
        scheduledStart: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 6, 0, 0),
        scheduledEnd: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 14, 0, 0),
        actualStart: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 6, 5, 0),
        actualEnd: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 14, 2, 0),
        status: 'COMPLETED',
        notes: 'Тестовая завершенная смена'
      };

      // Позавчерашняя пропущенная смена
      const missedShift = {
        processorId: processor.id,
        shiftType: 'DAY',
        shiftDate: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 14, 0, 0),
        scheduledStart: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 14, 0, 0),
        scheduledEnd: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 22, 0, 0),
        status: 'MISSED',
        notes: 'Тестовая пропущенная смена'
      };

      testShifts.push(completedShift, missedShift);
    }

    // Удаляем старые тестовые смены
    await prisma.processor_shifts.deleteMany({
      where: {
        notes: {
          contains: 'Тестовая'
        }
      }
    });

    // Создаем новые тестовые смены
    await prisma.processor_shifts.createMany({
      data: testShifts
    });

    console.log('✅ Тестовые смены созданы');

    // Создаем тестовые логи действий в analytics
    console.log('📝 Создание тестовых логов действий...');

    // Удаляем старые тестовые логи
    await prisma.analytics.deleteMany({
      where: {
        action: {
          startsWith: 'SHIFT_'
        },
        metadata: {
          contains: 'Тестовый'
        }
      }
    });

    const testLogs = [];

    for (const processor of processors.slice(0, 2)) {
      // Логи начала и конца смены за вчера
      testLogs.push({
        userId: processor.id,
        action: 'SHIFT_SHIFT_START',
        metadata: JSON.stringify({
          action: 'SHIFT_START',
          description: 'Тестовый: Начал утреннюю смену',
          shiftType: 'MORNING'
        }),
        ip: '127.0.0.1',
        userAgent: 'Test Agent',
        createdAt: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 6, 5, 0)
      });

      testLogs.push({
        userId: processor.id,
        action: 'SHIFT_SHIFT_END',
        metadata: JSON.stringify({
          action: 'SHIFT_END',
          description: 'Тестовый: Завершил утреннюю смену (продолжительность: 477 мин)',
          shiftType: 'MORNING',
          duration: 477 * 60 * 1000,
          autoEnded: false
        }),
        ip: '127.0.0.1',
        userAgent: 'Test Agent',
        createdAt: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 14, 2, 0)
      });

      // Лог начала смены позавчера (пропущенная смена)
      testLogs.push({
        userId: processor.id,
        action: 'SHIFT_SHIFT_START',
        metadata: JSON.stringify({
          action: 'SHIFT_START',
          description: 'Тестовый: Начал дневную смену',
          shiftType: 'DAY'
        }),
        ip: '127.0.0.1',
        userAgent: 'Test Agent',
        createdAt: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 14, 15, 0)
      });
    }

    await prisma.analytics.createMany({
      data: testLogs
    });

    console.log('✅ Тестовые логи действий созданы');

    // Выводим сводку
    console.log('\n📊 Сводка тестовых данных:');
    console.log(`👥 Процессоров: ${processors.length}`);
    console.log(`🔧 Администраторов: ${admins.length}`);
    console.log(`📅 Создано смен: ${testShifts.length}`);
    console.log(`📝 Создано логов: ${testLogs.length}`);
    
    console.log('\n🎯 Данные для тестирования:');
    console.log('1. Откройте страницу обработки (/processing) от имени процессора');
    console.log('2. Проверьте раздел "История действий" - должны быть видны только логи этого процессора');
    console.log('3. Откройте админ-панель (/admin/processing) от имени администратора');
    console.log('4. Перейдите в таб "Смены" -> "Логи смен" - должны быть видны логи всех процессоров');
    
    console.log('\n📧 Тестовые учетные записи:');
    for (const processor of processors) {
      console.log(`   Процессор: ${processor.email} (пароль: password123)`);
    }
    for (const admin of admins) {
      console.log(`   Администратор: ${admin.email} (пароль: password123)`);
    }

  } catch (error) {
    console.error('❌ Ошибка при создании тестовых данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createTestData();
}

module.exports = { createTestData };
