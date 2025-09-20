import { checkAdminAuthUserId } from "@/lib/admin-auth";
import { requireAdminAuth } from '@/lib/api-auth';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDayStartUTC3, TimePeriods } from "@/lib/time-utils";

// GET /api/admin/managers/[id]/stats - Получение статистики конкретного менеджера
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();
    const { id: processorId } = await params;

    // Получаем текущую дату и периоды
    const todayStart = getCurrentDayStartUTC3();
    
    // Получаем периоды по системному времени
    const weekPeriod = TimePeriods.thisWeek();
    const monthPeriod = TimePeriods.thisMonth();

    // Статистика за сегодня
    const todayDeposits = await prisma.processor_deposits.findMany({
      where: {
        processorId,
        createdAt: {
          gte: todayStart,
        },
      },
    });

    const todayStats = {
      depositsCount: todayDeposits.length,
      depositsSum: todayDeposits.reduce((sum, d) => sum + d.amount, 0),
      approvedSum: todayDeposits.reduce((sum, d) => sum + d.amount, 0),
      pendingCount: 0,
      rejectedCount: 0,
    };

    // Статистика за неделю
    const weekDeposits = await prisma.processor_deposits.findMany({
      where: {
        processorId,
        createdAt: {
          gte: weekPeriod.start,
        },
      },
    });

    // Статистика за месяц  
    const monthDeposits = await prisma.processor_deposits.findMany({
      where: {
        processorId,
        createdAt: {
          gte: monthPeriod.start,
        },
      },
    });

    // Получаем заявки на зарплату за месяц
    const monthSalary = await prisma.salary_requests.findMany({
      where: {
        processorId,
        createdAt: {
          gte: monthPeriod.start,
        },
        status: "PAID",
      },
    });

    // Получаем бонусы за месяц
    const monthBonuses = await prisma.bonus_payments.findMany({
      where: {
        processorId,
        createdAt: {
          gte: monthPeriod.start,
        },
        status: "PAID",
      },
    });

    // Получаем статистику за все время
    const allTimeDeposits = await prisma.processor_deposits.findMany({
      where: {
        processorId,
      },
    });

    // Получаем все бонусы
    const allTimeBonuses = await prisma.bonus_payments.findMany({
      where: {
        processorId,
        status: "PAID",
      },
    });

    // Расчет общих показателей
    const totalDeposits = allTimeDeposits.length;
    const totalAmount = allTimeDeposits.reduce((sum, d) => sum + d.amount, 0);
    const totalBonuses = allTimeBonuses.reduce((sum, b) => sum + b.amount, 0);
    const avgBonusRate = totalAmount > 0 ? Math.round((totalBonuses / totalAmount) * 100 * 100) / 100 : 0;

    // Статистика за текущий месяц
    const thisMonthDeposits = monthDeposits.length;
    const thisMonthAmount = monthDeposits.reduce((sum, d) => sum + d.amount, 0);
    const thisMonthBonuses = monthBonuses.reduce((sum, b) => sum + b.amount, 0);

    // Возвращаем в ожидаемом формате для интерфейса Manager
    const stats = {
      totalDeposits,
      totalAmount,
      totalBonuses,
      avgBonusRate,
      thisMonthDeposits,
      thisMonthAmount,
      thisMonthBonuses,
    };

    return NextResponse.json(stats);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка получения статистики менеджера:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

