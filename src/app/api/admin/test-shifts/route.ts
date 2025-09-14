import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";
import { getCurrentUTC3Time } from "@/lib/time-utils";

export async function POST(request: NextRequest) {
  // Проверяем авторизацию администратора
  const authResult = await requireAdminAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    console.log('🔧 Создание тестовых данных для системы смен...');

    // Получаем всех обработчиков
    const processors = await prisma.users.findMany({
      where: { 
        role: 'PROCESSOR',
        status: 'APPROVED'
      }
    });

    if (processors.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Нет активных обработчиков для создания смен'
      });
    }

    // Проверяем и создаем настройки смен
    const shiftSettings = await prisma.shift_settings.findMany();
    
    if (shiftSettings.length === 0) {
      const defaultSettings = [
        {
          shiftType: 'MORNING',
          startHour: 6,
          startMinute: 0,
          endHour: 14,
          endMinute: 0,
          name: 'Утренняя смена',
          description: 'Утренняя смена с 06:00 до 14:00 МСК'
        },
        {
          shiftType: 'DAY',
          startHour: 14,
          startMinute: 0,
          endHour: 22,
          endMinute: 0,
          name: 'Дневная смена',
          description: 'Дневная смена с 14:00 до 22:00 МСК'
        },
        {
          shiftType: 'NIGHT',
          startHour: 22,
          startMinute: 0,
          endHour: 6,
          endMinute: 0,
          name: 'Ночная смена',
          description: 'Ночная смена с 22:00 до 06:00 МСК'
        }
      ];

      for (const setting of defaultSettings) {
        await prisma.shift_settings.upsert({
          where: { shiftType: setting.shiftType as any },
          update: setting,
          create: setting
        });
      }
    }

    const currentTime = getCurrentUTC3Time();
    const today = new Date(currentTime);
    today.setUTCHours(6, 0, 0, 0); // Начало дня в UTC+3

    // Определяем типы смен и их время
    const shiftTypes = [
      { type: 'MORNING', startHour: 6, endHour: 14 },
      { type: 'DAY', startHour: 14, endHour: 22 },
      { type: 'NIGHT', startHour: 22, endHour: 6 } // Переходит на следующий день
    ];

    let createdShifts = 0;

    // Создаем смены для каждого обработчика на последние 7 дней
    for (let dayOffset = -7; dayOffset <= 0; dayOffset++) {
      const shiftDate = new Date(today);
      shiftDate.setUTCDate(today.getUTCDate() + dayOffset);

      for (const processor of processors) {
        // Каждый обработчик работает случайно 1-2 смены в день
        const shiftsPerDay = Math.floor(Math.random() * 2) + 1;
        const selectedShifts = shiftTypes.slice(0, shiftsPerDay);

        for (const shiftInfo of selectedShifts) {
          const scheduledStart = new Date(shiftDate);
          scheduledStart.setUTCHours(shiftInfo.startHour, 0, 0, 0);

          const scheduledEnd = new Date(shiftDate);
          if (shiftInfo.type === 'NIGHT') {
            // Ночная смена заканчивается на следующий день
            scheduledEnd.setUTCDate(shiftDate.getUTCDate() + 1);
            scheduledEnd.setUTCHours(shiftInfo.endHour, 0, 0, 0);
          } else {
            scheduledEnd.setUTCHours(shiftInfo.endHour, 0, 0, 0);
          }

          // Определяем статус смены
          let status = 'SCHEDULED';
          let actualStart = null;
          let actualEnd = null;
          let notes = null;

          // Для прошедших дней генерируем реалистичные данные
          if (dayOffset < 0) {
            const random = Math.random();
            if (random < 0.1) {
              // 10% смен пропущены
              status = 'MISSED';
            } else if (random < 0.8) {
              // 70% смен завершены
              status = 'COMPLETED';
              
              // Добавляем небольшие отклонения во времени начала и окончания
              actualStart = new Date(scheduledStart);
              actualStart.setMinutes(actualStart.getMinutes() + Math.floor(Math.random() * 10) - 5); // ±5 минут
              
              actualEnd = new Date(scheduledEnd);
              actualEnd.setMinutes(actualEnd.getMinutes() + Math.floor(Math.random() * 20) - 10); // ±10 минут
              
              const workQuality = ['Отличная работа', 'Хорошие результаты', 'Стандартная смена', 'Высокая активность'];
              notes = workQuality[Math.floor(Math.random() * workQuality.length)];
            } else {
              // 10% смен активны (для недавних дней)
              status = 'ACTIVE';
              actualStart = new Date(scheduledStart);
              actualStart.setMinutes(actualStart.getMinutes() + Math.floor(Math.random() * 10) - 5);
            }
          }

          // Проверяем, не существует ли уже такая смена
          const existingShift = await prisma.processor_shifts.findFirst({
            where: {
              processorId: processor.id,
              shiftType: shiftInfo.type as any,
              shiftDate: shiftDate
            }
          });

          if (!existingShift) {
            await prisma.processor_shifts.create({
              data: {
                processorId: processor.id,
                shiftType: shiftInfo.type as any,
                shiftDate: shiftDate,
                scheduledStart: scheduledStart,
                scheduledEnd: scheduledEnd,
                actualStart: actualStart,
                actualEnd: actualEnd,
                status: status as any,
                notes: notes
              }
            });

            createdShifts++;
          }
        }
      }
    }

    // Получаем статистику
    const stats = await prisma.processor_shifts.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const statusStats = stats.reduce((acc: any, stat: any) => {
      acc[stat.status.toLowerCase()] = stat._count.id;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      message: `Создано ${createdShifts} тестовых смен`,
      processorsCount: processors.length,
      stats: statusStats
    });

  } catch (error) {
    console.error('Ошибка создания тестовых данных смен:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
