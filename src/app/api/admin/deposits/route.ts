import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

// Проверка прав администратора
async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    throw new Error("Не авторизован");
  }

  const decoded = jwt.verify(token, JWT_SECRET) as {
    userId: string;
    role: string;
  };

  if (decoded.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  return decoded.userId;
}

// GET /api/admin/deposits - Получение всех депозитов с фильтрацией и аналитикой
export async function GET(request: NextRequest) {
  try {
    await checkAdminAuth();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const currency = searchParams.get("currency");
    const currencyType = searchParams.get("currencyType");
    const processorId = searchParams.get("processorId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const search = searchParams.get("search"); // Поиск по email или processorId
    
    const skip = (page - 1) * limit;

    // Формируем условия поиска
    const where: any = {};

    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    if (currency && currency !== "all") {
      where.currency = currency.toUpperCase();
    }

    if (currencyType && currencyType !== "all") {
      where.currencyType = currencyType.toUpperCase();
    }

    if (processorId && processorId !== "all") {
      where.processorId = processorId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    if (search) {
      where.OR = [
        { playerEmail: { contains: search, mode: 'insensitive' } },
        { processor: { email: { contains: search, mode: 'insensitive' } } },
        { processor: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Получаем депозиты с информацией об обработчиках
    const [deposits, total] = await Promise.all([
      prisma.processor_deposits.findMany({
        where,
        include: {
          processor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder as "asc" | "desc",
        },
        skip,
        take: limit,
      }),
      prisma.processor_deposits.count({ where }),
    ]);

    // Получаем аналитику
    const analytics = await getDepositsAnalytics(where);

    return NextResponse.json({
      deposits,
      analytics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка получения депозитов:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// Функция для получения аналитики по депозитам
async function getDepositsAnalytics(baseWhere: any) {
  try {
    // Общая сумма депозитов
    const totalSums = await prisma.processor_deposits.aggregate({
      where: baseWhere,
      _sum: {
        amount: true,
        bonusAmount: true,
      },
      _count: {
        id: true,
      },
    });

    // Суммы по валютам
    const currencySums = await prisma.processor_deposits.groupBy({
      by: ['currency', 'currencyType'],
      where: baseWhere,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
    });

    // Суммы по обработчикам
    const processorSums = await prisma.processor_deposits.groupBy({
      by: ['processorId'],
      where: baseWhere,
      _sum: {
        amount: true,
        bonusAmount: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: 10, // Топ 10 обработчиков
    });

    // Получаем информацию об обработчиках для топа
    const processorIds = processorSums.map(p => p.processorId);
    const processors = await prisma.users.findMany({
      where: {
        id: { in: processorIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const processorsMap = processors.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, any>);

    // Суммы по статусам
    const statusSums = await prisma.processor_deposits.groupBy({
      by: ['status'],
      where: baseWhere,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      total: {
        amount: totalSums._sum.amount || 0,
        bonusAmount: totalSums._sum.bonusAmount || 0,
        count: totalSums._count.id || 0,
      },
      currencies: currencySums.map(c => ({
        currency: c.currency,
        currencyType: c.currencyType,
        amount: c._sum.amount || 0,
        count: c._count.id || 0,
      })),
      processors: processorSums.map(p => ({
        processorId: p.processorId,
        processor: processorsMap[p.processorId] || null,
        amount: p._sum.amount || 0,
        bonusAmount: p._sum.bonusAmount || 0,
        count: p._count.id || 0,
      })),
      statuses: statusSums.map(s => ({
        status: s.status,
        amount: s._sum.amount || 0,
        count: s._count.id || 0,
      })),
    };
  } catch (error) {
    console.error("Ошибка получения аналитики:", error);
    return {
      total: { amount: 0, bonusAmount: 0, count: 0 },
      currencies: [],
      processors: [],
      statuses: [],
    };
  }
}
