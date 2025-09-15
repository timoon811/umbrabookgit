import { NextRequest, NextResponse } from "next/server";
import { requireManagerAuth } from "@/lib/api-auth";
import { SalaryLogger } from "@/lib/salary-logger";

export async function GET(request: NextRequest) {
  // Проверяем авторизацию
  const authResult = await requireManagerAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { user } = authResult;
  
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type"); // фильтр по типу начислений
    const shiftId = searchParams.get("shiftId"); // фильтр по конкретной смене
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Дефолтный период - текущий месяц
    const defaultStartDate = new Date();
    defaultStartDate.setDate(1);
    defaultStartDate.setHours(0, 0, 0, 0);
    
    const defaultEndDate = new Date();
    defaultEndDate.setHours(23, 59, 59, 999);

    const periodStartDate = startDate ? new Date(startDate) : defaultStartDate;
    const periodEndDate = endDate ? new Date(endDate) : defaultEndDate;

    // Получаем детализацию заработков
    const breakdown = await SalaryLogger.getEarningsBreakdown(
      user.userId,
      periodStartDate,
      periodEndDate
    );

    // Получаем подробные логи с фильтрацией и пагинацией
    const { prisma } = await import("@/lib/prisma");
    
    const where: any = {
      processorId: user.userId,
      createdAt: {
        gte: periodStartDate,
        lte: periodEndDate,
      },
    };

    if (type && type !== 'all') {
      where.type = type.toUpperCase();
    }

    if (shiftId) {
      where.shiftId = shiftId;
    }

    const skip = (page - 1) * limit;

    const [earningsLogs, total] = await Promise.all([
      prisma.salary_earnings_log.findMany({
        where,
        include: {
          shift: {
            select: {
              id: true,
              shiftType: true,
              shiftDate: true,
            },
          },
          deposit: {
            select: {
              id: true,
              amount: true,
              currency: true,
              playerId: true,
              playerEmail: true,
            },
          },
          salaryRequest: {
            select: {
              id: true,
              periodStart: true,
              periodEnd: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.salary_earnings_log.count({ where }),
    ]);

    // Получаем доступные смены для фильтра
    const availableShifts = await prisma.processor_shifts.findMany({
      where: {
        processorId: user.userId,
        shiftDate: {
          gte: periodStartDate,
          lte: periodEndDate,
        },
      },
      select: {
        id: true,
        shiftType: true,
        shiftDate: true,
        status: true,
      },
      orderBy: {
        shiftDate: 'desc',
      },
    });

    // Статистика по типам заработков
    const typeStats = Object.values(breakdown.breakdown).map((item: any) => ({
      type: item.type,
      totalAmount: item.totalAmount,
      count: item.count,
      percentage: breakdown.totalEarnings > 0 ? (item.totalAmount / breakdown.totalEarnings) * 100 : 0,
    }));

    return NextResponse.json({
      breakdown: {
        ...breakdown,
        typeStats,
      },
      logs: earningsLogs,
      availableShifts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        startDate: periodStartDate.toISOString(),
        endDate: periodEndDate.toISOString(),
        type: type || 'all',
        shiftId: shiftId || null,
      },
    });
  } catch (error) {
    console.error("Ошибка получения детализации заработков:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// Получение статистики заработков по сменам
export async function POST(request: NextRequest) {
  const authResult = await requireManagerAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { user } = authResult;

  try {
    const { startDate, endDate } = await request.json();
    
    const { prisma } = await import("@/lib/prisma");
    
    // Получаем заработки, сгруппированные по сменам
    const shiftEarnings = await prisma.salary_earnings_log.groupBy({
      by: ['shiftId'],
      where: {
        processorId: user.userId,
        shiftId: { not: null },
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Получаем детали смен
    const shiftIds = shiftEarnings.map(s => s.shiftId).filter(Boolean);
    const shifts = await prisma.processor_shifts.findMany({
      where: {
        id: { in: shiftIds as string[] },
      },
      select: {
        id: true,
        shiftType: true,
        shiftDate: true,
        actualStart: true,
        actualEnd: true,
        status: true,
      },
    });

    // Объединяем данные
    const shiftBreakdown = shiftEarnings.map(earning => {
      const shift = shifts.find(s => s.id === earning.shiftId);
      return {
        shiftId: earning.shiftId,
        shift,
        totalEarnings: earning._sum.amount || 0,
        entriesCount: earning._count.id,
      };
    }).sort((a, b) => {
      const dateA = a.shift?.shiftDate ? new Date(a.shift.shiftDate) : new Date(0);
      const dateB = b.shift?.shiftDate ? new Date(b.shift.shiftDate) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({
      shiftBreakdown,
      totalShifts: shiftBreakdown.length,
      totalEarnings: shiftEarnings.reduce((sum, s) => sum + (s._sum.amount || 0), 0),
    });
  } catch (error) {
    console.error("Ошибка получения статистики по сменам:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
