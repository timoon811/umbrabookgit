import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from '@/lib/api-auth';
import { prisma } from "@/lib/prisma";
import { requireManagerAuth } from "@/lib/api-auth";
import { getCurrentDayStartUTC3, TimePeriods } from '@/lib/time-utils';
import { getSystemTime } from '@/lib/system-time';

export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;

// Проверяем авторизацию
  // Для админов показываем общую статистику, для менеджеров - их личную
    const processorId = user.role === "ADMIN" ? null : user.userId;

    // Получаем текущую дату по UTC+3
    const utc3Now = getSystemTime();
    const todayStart = getCurrentDayStartUTC3();

    // Получаем периоды по UTC+3
    const weekPeriod = TimePeriods.thisWeek();
    const monthPeriod = TimePeriods.thisMonth();

    // Для обратной совместимости сохраняем старые переменные
    const weekStart = weekPeriod.start;
    const monthStart = monthPeriod.start;


    // Статистика за сегодня
    const todayDeposits = await prisma.processor_deposits.findMany({
      where: {
        ...(processorId && { processorId }),
        createdAt: {
          gte: todayStart,
        },
      },
    });

    const todayStats = {
      depositsCount: todayDeposits.length,
      depositsSum: todayDeposits.reduce((sum, d) => sum + d.amount, 0),
      approvedSum: todayDeposits.reduce((sum, d) => sum + d.amount, 0), // Все депозиты автоматически одобрены
      pendingCount: 0, // Больше нет статусов
      rejectedCount: 0, // Больше нет статусов
    };

    // Статистика за неделю
    const weekDeposits = await prisma.processor_deposits.findMany({
      where: {
        ...(processorId && { processorId }),
        createdAt: {
          gte: weekStart,
        },
      },
    });

    // Статистика за месяц
    const monthDeposits = await prisma.processor_deposits.findMany({
      where: {
        ...(processorId && { processorId }),
        createdAt: {
          gte: monthStart,
        },
      },
    });

    // Выплаченная зарплата за месяц
    const monthSalary = await prisma.salary_requests.findMany({
      where: {
        ...(processorId && { processorId }),
        status: "PAID",
        paidAt: {
          gte: monthStart,
        },
      },
    });

    // Бонусы за месяц
    const monthBonuses = await prisma.bonus_payments.findMany({
      where: {
        ...(processorId && { processorId }),
        status: "PAID",
        paidAt: {
          gte: monthStart,
        },
      },
    });

    // Баланс
    const allApprovedDeposits = await prisma.processor_deposits.findMany({
      where: {
        ...(processorId && { processorId }),
      },
    });

    const allPaidSalary = await prisma.salary_requests.findMany({
      where: {
        ...(processorId && { processorId }),
        status: "PAID",
      },
    });

    const earned = Math.max(0, allApprovedDeposits.reduce((sum, d) => sum + d.processorEarnings, 0));
    const paid = Math.max(0, allPaidSalary.reduce((sum, s) => sum + (s.calculatedAmount || s.requestedAmount), 0));
    const available = Math.max(0, earned - paid);

    const stats = {
      today: todayStats,
      period: {
        weekDeposits: weekDeposits.reduce((sum, d) => sum + d.amount, 0),
        monthDeposits: monthDeposits.reduce((sum, d) => sum + d.amount, 0),
        salaryPaid: monthSalary.reduce((sum, s) => sum + (s.calculatedAmount || s.requestedAmount), 0),
        bonuses: monthBonuses.reduce((sum, b) => sum + b.amount, 0),
      },
      balance: {
        earned: Math.round(earned * 100) / 100,
        paid: Math.round(paid * 100) / 100,
        pending: 0, // Pending заявки на зарплату
        available: Math.round(available * 100) / 100,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Ошибка получения статистики менеджера:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
