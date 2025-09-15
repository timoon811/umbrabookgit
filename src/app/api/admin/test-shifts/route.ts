import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const authResult = await requireAdminAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    // Получаем всех менеджеров
    const managers = await prisma.users.findMany({
      where: {
        role: 'PROCESSOR'
      },
      select: {
        id: true,
        name: true,
      }
    });

    if (managers.length === 0) {
      return NextResponse.json(
        { error: "Нет менеджеров в системе" },
        { status: 400 }
      );
    }

    // Создаем тестовые смены за последние 7 дней
    const testShifts = [];
    const today = new Date();
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const shiftDate = new Date(today);
      shiftDate.setDate(today.getDate() - dayOffset);
      
      // Для каждого дня создаем смены для случайных менеджеров
      const shuffledManagers = managers.sort(() => 0.5 - Math.random());
      const selectedManagers = shuffledManagers.slice(0, Math.min(3, managers.length));
      
      for (const manager of selectedManagers) {
        const shiftTypes = ['MORNING', 'DAY', 'NIGHT'];
        const randomShiftType = shiftTypes[Math.floor(Math.random() * shiftTypes.length)];
        
        // Определяем время смены
        let startHour, endHour;
        switch (randomShiftType) {
          case 'MORNING':
            startHour = 6;
            endHour = 14;
            break;
          case 'DAY':
            startHour = 14;
            endHour = 22;
            break;
          case 'NIGHT':
            startHour = 22;
            endHour = 6;
            break;
          default:
            startHour = 9;
            endHour = 17;
        }
        
        const scheduledStart = new Date(shiftDate);
        scheduledStart.setHours(startHour, 0, 0, 0);
        
        const scheduledEnd = new Date(shiftDate);
        if (endHour < startHour) {
          // Ночная смена переходит на следующий день
          scheduledEnd.setDate(scheduledEnd.getDate() + 1);
        }
        scheduledEnd.setHours(endHour, 0, 0, 0);
        
        // Случайный статус
        const statuses = ['SCHEDULED', 'ACTIVE', 'COMPLETED', 'MISSED'];
        const weights = [0.1, 0.1, 0.7, 0.1]; // Больше вероятность для COMPLETED
        let randomStatus = 'COMPLETED';
        const random = Math.random();
        let cumulative = 0;
        for (let i = 0; i < statuses.length; i++) {
          cumulative += weights[i];
          if (random <= cumulative) {
            randomStatus = statuses[i];
            break;
          }
        }
        
        // Фактическое время работы (если смена не пропущена)
        let actualStart = null;
        let actualEnd = null;
        
        if (randomStatus !== 'MISSED' && randomStatus !== 'SCHEDULED') {
          actualStart = new Date(scheduledStart);
          // Добавляем случайное отклонение в начале (±30 минут)
          actualStart.setMinutes(actualStart.getMinutes() + (Math.random() - 0.5) * 60);
          
          if (randomStatus === 'COMPLETED') {
            actualEnd = new Date(scheduledEnd);
            // Добавляем случайное отклонение в конце (±30 минут)
            actualEnd.setMinutes(actualEnd.getMinutes() + (Math.random() - 0.5) * 60);
          }
        }
        
        testShifts.push({
          processorId: manager.id,
          shiftType: randomShiftType,
          shiftDate: shiftDate,
          scheduledStart: scheduledStart,
          scheduledEnd: scheduledEnd,
          actualStart: actualStart,
          actualEnd: actualEnd,
          status: randomStatus,
          notes: randomStatus === 'MISSED' ? 'Автоматически помечена как пропущенная' : null,
        });
      }
    }
    
    // Удаляем существующие тестовые данные
    await prisma.processor_shifts.deleteMany({
      where: {
        notes: 'Автоматически помечена как пропущенная'
      }
    });
    
    // Создаем новые тестовые смены
    const createdShifts = await prisma.processor_shifts.createMany({
      data: testShifts,
      skipDuplicates: true,
    });

    return NextResponse.json({
      message: `Создано ${createdShifts.count} тестовых смен`,
      count: createdShifts.count,
    });
  } catch (error) {
    console.error('Ошибка создания тестовых смен:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
