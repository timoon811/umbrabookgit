import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    
    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }

  
    
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const currency = searchParams.get('currency');
    const currencyType = searchParams.get('currencyType');
    const processorId = searchParams.get('processorId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Формируем условия для поиска
    const where: any = {};

    if (currency && currency !== 'all') {
      where.currency = currency;
    }

    if (currencyType && currencyType !== 'all') {
      where.currencyType = currencyType;
    }

    if (processorId && processorId !== 'all') {
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
        { playerId: { contains: search, mode: 'insensitive' } },
        { processor: { name: { contains: search, mode: 'insensitive' } } },
        { processor: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Определяем поле сортировки
    let orderBy: any = {};
    if (sortBy === 'processor') {
      orderBy = { processor: { name: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    // Получаем депозиты с пагинацией
    const [deposits, total] = await Promise.all([
      prisma.processor_deposits.findMany({
        where,
        include: {
          processor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy,
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
  } catch (error) {
    console.error('Ошибка получения депозитов:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

async function getDepositsAnalytics(where: any) {
  try {
    // Общая статистика
    const total = await prisma.processor_deposits.aggregate({
      where,
      _sum: {
        amount: true,
        bonusAmount: true,
      },
      _count: {
        id: true,
      },
    });

    // Статистика по валютам
    const currencies = await prisma.processor_deposits.groupBy({
      where,
      by: ['currency', 'currencyType'],
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Статистика по менеджерам
    const processors = await prisma.processor_deposits.groupBy({
      where,
      by: ['processorId'],
      _sum: {
        amount: true,
        bonusAmount: true,
      },
      _count: {
        id: true,
      },
    });

    // Получаем данные менеджеров
    const processorsWithData = await Promise.all(
      processors.map(async (p) => {
        const processor = await prisma.users.findUnique({
          where: { id: p.processorId },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        return {
          processorId: p.processorId,
          processor,
          amount: p._sum.amount || 0,
          bonusAmount: p._sum.bonusAmount || 0,
          count: p._count.id,
        };
      })
    );

    return {
      total: {
        amount: total._sum.amount || 0,
        bonusAmount: total._sum.bonusAmount || 0,
        count: total._count.id,
      },
      currencies: currencies.map(c => ({
        currency: c.currency,
        currencyType: c.currencyType,
        amount: c._sum.amount || 0,
        count: c._count.id,
      })),
      processors: processorsWithData,
    };
  } catch (error) {
    console.error('Ошибка получения аналитики депозитов:', error);
    return {
      total: { amount: 0, bonusAmount: 0, count: 0 },
      currencies: [],
      processors: [],
    };
  }
}
