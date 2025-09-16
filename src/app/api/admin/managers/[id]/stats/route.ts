import { checkAdminAuthUserId } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUTC3Time,
  getCurrentDayStartUTC3,
  getCurrentWeekPeriod,
  getCurrentMonthPeriod
} from "@/lib/time-utils";

// GET /api/admin/managers/[id]/stats - Получение статистики конкретного менеджера
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdminAuthUserId();
    const { id: processorId } = await params;

    // Получаем текущую дату по UTC+3
    const utc3Now = getCurrentUTC3Time();
    const todayStart = getCurrentDayStartUTC3();
    
    // Получаем периоды по UTC+3
    const weekPeriod = getCurrentWeekPeriod();
    const monthPeriod = getCurrentMonthPeriod();

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

    // Расчет заработка и доступности
    const earned = monthDeposits.reduce((sum, d) => sum + d.processorEarnings, 0) +
                  monthBonuses.reduce((sum, b) => sum + b.amount, 0);
                  
    const paid = monthSalary.reduce((sum, s) => sum + (s.calculatedAmount || s.requestedAmount), 0);
    const available = earned - paid;

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
        pending: 0,
        available: Math.round(available * 100) / 100,
      },
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

