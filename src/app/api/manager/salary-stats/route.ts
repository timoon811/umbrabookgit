import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProcessorAuth } from "@/lib/api-auth";
import {
  getCurrentUTC3Time,
  getCurrentDayStartUTC3,
  getCurrentMonthPeriod
} from "@/lib/time-utils";

export async function GET(request: NextRequest) {
  // Проверяем авторизацию
  const authResult = await requireProcessorAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { user } = authResult;

  try {
    const processorId = user.userId;
    const utc3Now = getCurrentUTC3Time();
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

    // Функция расчета отработанных часов
    const calculateWorkHours = (shifts: any[]) => {
      return shifts.reduce((total, shift) => {
        if (shift.actualStart && shift.actualEnd) {
          const start = new Date(shift.actualStart);
          const end = new Date(shift.actualEnd);
          return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        } else if (shift.actualStart && shift.status === 'ACTIVE') {
          // Для активной смены считаем время от начала до сейчас
          const start = new Date(shift.actualStart);
          const now = utc3Now;
          return total + (now.getTime() - start.getTime()) / (1000 * 60 * 60);
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
