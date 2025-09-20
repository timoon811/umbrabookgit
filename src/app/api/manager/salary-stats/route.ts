import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from '@/lib/api-auth';
import { prisma } from "@/lib/prisma";
import { requireManagerAuth } from "@/lib/api-auth";
import { getCurrentDayStartUTC3,
  getCurrentMonthPeriod
 } from '@/lib/time-utils';
import { getSystemTime } from '@/lib/system-time';

export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;

// Проверяем авторизацию
  const processorId = user.userId;
    const utc3Now = getSystemTime();
    const todayStart = getCurrentDayStartUTC3();
    const monthPeriod = getCurrentMonthPeriod();

    // Получаем настройки зарплаты
    const salarySettings = await prisma.salary_settings.findFirst({
      where: { isActive: true }
    });

    // Получаем настройки комиссии платформы
    const platformCommission = await prisma.platform_commission.findFirst({
      where: { isActive: true }
    });

    const hourlyRate = salarySettings?.hourlyRate || 2.0;
    const platformCommissionPercent = platformCommission?.commissionPercent || 0;

    // Получаем смены за сегодня и за месяц
    const [todayShifts, monthShifts] = await Promise.all([
      prisma.processor_shifts.findMany({
        where: { 
          processorId, 
          shiftDate: { gte: todayStart },
          status: { in: ['COMPLETED', 'ACTIVE'] }
        }
      }),
      prisma.processor_shifts.findMany({
        where: { 
          processorId, 
          shiftDate: { gte: monthPeriod.start },
          status: { in: ['COMPLETED', 'ACTIVE'] }
        }
      })
    ]);

    // Функция расчета отработанных часов с проверками корректности
    const calculateWorkHours = (shifts: any[]) => {
      return shifts.reduce((total, shift) => {
        if (shift.actualStart && shift.actualEnd) {
          const start = new Date(shift.actualStart);
          const end = new Date(shift.actualEnd);
          
          // Проверяем корректность времени
          if (end <= start) {
            console.warn(`[SALARY_STATS] Некорректное время смены ${shift.id}: конец (${end.toISOString()}) раньше или равен началу (${start.toISOString()})`);
            return total;
          }
          
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          
          // Проверяем разумные границы (не более 24 часов за смену)
          if (hours > 0 && hours <= 24) {
            return total + hours;
          } else {
            console.warn(`[SALARY_STATS] Некорректная продолжительность смены ${shift.id}: ${hours.toFixed(2)} часов`);
            return total;
          }
        } else if (shift.actualStart && shift.status === 'ACTIVE') {
          // Для активной смены считаем время от начала до сейчас
          const start = new Date(shift.actualStart);
          const now = utc3Now;
          
          if (now <= start) {
            console.warn(`[SALARY_STATS] Некорректное время активной смены ${shift.id}: текущее время раньше или равно началу`);
            return total;
          }
          
          const hours = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
          
          // Ограничиваем активную смену разумными пределами (не более 24 часов)
          if (hours > 0 && hours <= 24) {
            return total + hours;
          } else {
            console.warn(`[SALARY_STATS] Некорректная продолжительность активной смены ${shift.id}: ${hours.toFixed(2)} часов`);
            return total;
          }
        }
        return total;
      }, 0);
    };

    const todayHours = calculateWorkHours(todayShifts);
    const monthHours = calculateWorkHours(monthShifts);

    // Расчет базовой зарплаты
    const todayBaseSalary = todayHours * hourlyRate;
    const monthBaseSalary = monthHours * hourlyRate;

    // Прогноз на месяц на основе текущего темпа
    const daysInMonth = new Date(utc3Now.getFullYear(), utc3Now.getMonth() + 1, 0).getDate();
    const daysPassed = utc3Now.getDate();
    const avgDailyBaseSalary = daysPassed > 0 ? monthBaseSalary / daysPassed : 0;
    const projectedMonthSalary = avgDailyBaseSalary * daysInMonth;

    // Получаем информацию об активной смене
    const activeShift = todayShifts.find(shift => shift.status === 'ACTIVE');
    let currentActiveHours = 0;
    if (activeShift && activeShift.actualStart) {
      const start = new Date(activeShift.actualStart);
      currentActiveHours = (utc3Now.getTime() - start.getTime()) / (1000 * 60 * 60);
    }

    return NextResponse.json({
      todayHours,
      monthHours,
      todayBaseSalary,
      monthBaseSalary,
      projectedMonthSalary,
      hourlyRate,
      currentActiveHours,
      hasActiveShift: !!activeShift,
      platformCommissionPercent
    });

  } catch (error) {
    console.error("Ошибка получения статистики зарплаты:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
