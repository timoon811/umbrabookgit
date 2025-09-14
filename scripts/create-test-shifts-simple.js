// Простой скрипт для создания тестовых смен без авторизации
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestShifts() {
  try {
    console.log('🔧 Создание тестовых смен...');

    // Получаем первого доступного обработчика
    const processor = await prisma.users.findFirst({
      where: { 
        role: 'PROCESSOR',
        status: 'APPROVED'
      }
    });

    if (!processor) {
      console.log('❌ Нет активных обработчиков');
      return;
    }

    console.log(`📋 Найден обработчик: ${processor.name} (${processor.email})`);

    // Создаем несколько тестовых смен
    const today = new Date();
    today.setUTCHours(6, 0, 0, 0); // Начало дня в UTC+3

    const testShifts = [
      {
        processorId: processor.id,
        shiftType: 'MORNING',
        shiftDate: new Date(today),
        scheduledStart: new Date(today.getTime()),
        scheduledEnd: new Date(today.getTime() + 8 * 60 * 60 * 1000), // +8 часов
        status: 'COMPLETED',
        actualStart: new Date(today.getTime() + 5 * 60 * 1000), // +5 минут опоздание
        actualEnd: new Date(today.getTime() + 8 * 60 * 60 * 1000 - 10 * 60 * 1000), // -10 минут раньше
        notes: 'Тестовая смена - хорошая работа'
      },
      {
        processorId: processor.id,
        shiftType: 'DAY',
        shiftDate: new Date(today.getTime() - 24 * 60 * 60 * 1000), // Вчера
        scheduledStart: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // 14:00
        scheduledEnd: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 22 * 60 * 60 * 1000), // 22:00
        status: 'COMPLETED',
        actualStart: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
        actualEnd: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 22 * 60 * 60 * 1000),
        notes: 'Стандартная смена'
      },
      {
        processorId: processor.id,
        shiftType: 'NIGHT',
        shiftDate: new Date(today.getTime() - 48 * 60 * 60 * 1000), // Позавчера
        scheduledStart: new Date(today.getTime() - 48 * 60 * 60 * 1000 + 22 * 60 * 60 * 1000), // 22:00
        scheduledEnd: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 06:00 следующий день
        status: 'MISSED',
        notes: null
      }
    ];

    let created = 0;
    for (const shift of testShifts) {
      // Проверяем, не существует ли уже такая смена
      const existing = await prisma.processor_shifts.findFirst({
        where: {
          processorId: shift.processorId,
          shiftType: shift.shiftType,
          shiftDate: shift.shiftDate
        }
      });

      if (!existing) {
        await prisma.processor_shifts.create({
          data: shift
        });
        created++;
      }
    }

    console.log(`✅ Создано ${created} тестовых смен`);

    // Показываем статистику
    const total = await prisma.processor_shifts.count();
    console.log(`📊 Всего смен в базе: ${total}`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestShifts();
