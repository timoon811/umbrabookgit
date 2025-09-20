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
    const depositType = searchParams.get('depositType') || 'all'; // новый параметр фильтрации

    console.log('[ADMIN_DEPOSITS] 📊 Запрос депозитов:', {
      page, limit, currency, currencyType, processorId, depositType,
      dateFrom, dateTo, search, sortBy, sortOrder
    });

    // Получаем объединенные депозиты из обеих таблиц
    const allDeposits = await getCombinedDeposits({
      page,
      limit,
      currency,
      currencyType,
      processorId,
      dateFrom,
      dateTo,
      search,
      sortBy,
      sortOrder,
      depositType
    });

    console.log('[ADMIN_DEPOSITS] ✅ Найдено депозитов:', allDeposits.deposits.length, 'из', allDeposits.pagination.total);

    return NextResponse.json(allDeposits);
  } catch (error) {
    console.error('[ADMIN_DEPOSITS] ❌ Ошибка получения депозитов:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// Функция для получения объединенных депозитов из обеих таблиц
async function getCombinedDeposits(params: {
  page: number;
  limit: number;
  currency?: string | null;
  currencyType?: string | null;
  processorId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  search?: string | null;
  sortBy: string;
  sortOrder: string;
  depositType?: string | null;
}) {
  const { page, limit, currency, currencyType, processorId, dateFrom, dateTo, search, sortBy, sortOrder, depositType } = params;
  const skip = (page - 1) * limit;

  let allDeposits: any[] = [];
  let totalCount = 0;

  // 1. Получаем депозиты обработчиков (processor_deposits)
  if (depositType === 'all' || depositType === 'processor') {
    const processorWhere: any = {};

    if (currency && currency !== 'all') {
      processorWhere.currency = currency;
    }
    if (currencyType && currencyType !== 'all') {
      processorWhere.currencyType = currencyType;
    }
    if (processorId && processorId !== 'all') {
      processorWhere.processorId = processorId;
    }
    if (dateFrom || dateTo) {
      processorWhere.createdAt = {};
      if (dateFrom) processorWhere.createdAt.gte = new Date(dateFrom);
      if (dateTo) processorWhere.createdAt.lte = new Date(dateTo);
    }
    if (search) {
      processorWhere.OR = [
        { playerEmail: { contains: search, mode: 'insensitive' } },
        { playerId: { contains: search, mode: 'insensitive' } },
        { processor: { name: { contains: search, mode: 'insensitive' } } },
        { processor: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const processorDeposits = await prisma.processor_deposits.findMany({
      where: processorWhere,
      include: {
        processor: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Преобразуем processor_deposits в единый формат
    processorDeposits.forEach(deposit => {
      allDeposits.push({
        id: deposit.id,
        amount: deposit.amount,
        currency: deposit.currency,
        currencyType: deposit.currencyType,
        playerEmail: deposit.playerEmail || 'N/A',
        playerId: deposit.playerId,
        notes: deposit.notes,
        paymentMethod: deposit.paymentMethod,
        createdAt: deposit.createdAt,
        processor: deposit.processor,
        type: 'manual', // Тип: ручные депозиты обработчиков
        status: deposit.status,
        source: 'Обработчик',
        // Дополнительные поля только для processor_deposits
        commissionRate: deposit.commissionRate,
        bonusAmount: deposit.bonusAmount,
        processorEarnings: deposit.processorEarnings
      });
    });
  }

  // 2. Получаем депозиты из внешних источников (deposits)
  if (depositType === 'all' || depositType === 'external') {
    const externalWhere: any = {};

    if (currency && currency !== 'all') {
      externalWhere.token = currency; // В таблице deposits валюта хранится в поле token
    }
    if (dateFrom || dateTo) {
      externalWhere.createdAt = {};
      if (dateFrom) externalWhere.createdAt.gte = new Date(dateFrom);
      if (dateTo) externalWhere.createdAt.lte = new Date(dateTo);
    }
    if (search) {
      externalWhere.OR = [
        { mammothLogin: { contains: search, mode: 'insensitive' } },
        { mammothId: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } }
      ];
    }

    const externalDeposits = await prisma.deposits.findMany({
      where: externalWhere,
      include: {
        depositSource: {
          select: { name: true, project: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Преобразуем deposits в единый формат
    externalDeposits.forEach(deposit => {
      allDeposits.push({
        id: deposit.id,
        amount: deposit.amount,
        currency: deposit.token,
        currencyType: 'CRYPTO', // Внешние депозиты обычно криптовалютные
        playerEmail: deposit.mammothLogin || 'N/A',
        playerId: deposit.mammothId,
        notes: `Домен: ${deposit.domain}${deposit.mammothPromo ? `, Промо: ${deposit.mammothPromo}` : ''}`,
        paymentMethod: 'Crypto',
        createdAt: deposit.createdAt,
        processor: null, // У внешних депозитов нет назначенного обработчика
        type: 'external', // Тип: внешние депозиты
        status: deposit.processed ? 'PROCESSED' : 'PENDING',
        source: deposit.depositSource?.name || 'Внешний источник',
        // Дополнительные поля только для deposits
        netAmount: deposit.netAmount,
        netAmountUsd: deposit.netAmountUsd,
        commissionPercent: deposit.commissionPercent,
        txHash: deposit.txHash,
        mammothCountry: deposit.mammothCountry
      });
    });
  }

  // Сортируем объединенные депозиты
  allDeposits.sort((a, b) => {
    let aValue: any, bValue: any;
    
    if (sortBy === 'createdAt') {
      aValue = new Date(a.createdAt).getTime();
      bValue = new Date(b.createdAt).getTime();
    } else if (sortBy === 'amount') {
      aValue = a.amount;
      bValue = b.amount;
    } else if (sortBy === 'processor') {
      aValue = a.processor?.name || 'zzz'; // Внешние депозиты в конце
      bValue = b.processor?.name || 'zzz';
    } else {
      aValue = a[sortBy] || '';
      bValue = b[sortBy] || '';
    }

    if (sortOrder === 'desc') {
      return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
    } else {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    }
  });

  totalCount = allDeposits.length;

  // Применяем пагинацию
  const paginatedDeposits = allDeposits.slice(skip, skip + limit);

  // Получаем аналитику для обеих таблиц
  const analytics = await getCombinedAnalytics({ currency, currencyType, processorId, dateFrom, dateTo, search, depositType });

  return {
    deposits: paginatedDeposits,
    analytics,
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit),
    },
  };
}

async function getCombinedAnalytics(params: {
  currency?: string | null;
  currencyType?: string | null;
  processorId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  search?: string | null;
  depositType?: string | null;
}) {
  const { currency, currencyType, processorId, dateFrom, dateTo, search, depositType } = params;

  let totalAmount = 0;
  let totalBonusAmount = 0;
  let totalCount = 0;
  let currencies: any[] = [];
  let processors: any[] = [];

  // Анализируем processor_deposits
  if (depositType === 'all' || depositType === 'processor') {
    const processorWhere: any = {};
    if (currency && currency !== 'all') processorWhere.currency = currency;
    if (currencyType && currencyType !== 'all') processorWhere.currencyType = currencyType;
    if (processorId && processorId !== 'all') processorWhere.processorId = processorId;
    if (dateFrom || dateTo) {
      processorWhere.createdAt = {};
      if (dateFrom) processorWhere.createdAt.gte = new Date(dateFrom);
      if (dateTo) processorWhere.createdAt.lte = new Date(dateTo);
    }
    if (search) {
      processorWhere.OR = [
        { playerEmail: { contains: search, mode: 'insensitive' } },
        { playerId: { contains: search, mode: 'insensitive' } },
        { processor: { name: { contains: search, mode: 'insensitive' } } },
        { processor: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const processorStats = await prisma.processor_deposits.aggregate({
      where: processorWhere,
      _sum: { amount: true, bonusAmount: true },
      _count: { id: true },
    });

    totalAmount += processorStats._sum.amount || 0;
    totalBonusAmount += processorStats._sum.bonusAmount || 0;
    totalCount += processorStats._count.id || 0;
  }

  // Анализируем deposits
  if (depositType === 'all' || depositType === 'external') {
    const externalWhere: any = {};
    if (currency && currency !== 'all') externalWhere.token = currency;
    if (dateFrom || dateTo) {
      externalWhere.createdAt = {};
      if (dateFrom) externalWhere.createdAt.gte = new Date(dateFrom);
      if (dateTo) externalWhere.createdAt.lte = new Date(dateTo);
    }
    if (search) {
      externalWhere.OR = [
        { mammothLogin: { contains: search, mode: 'insensitive' } },
        { mammothId: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } }
      ];
    }

    const externalStats = await prisma.deposits.aggregate({
      where: externalWhere,
      _sum: { amount: true },
      _count: { id: true },
    });

    totalAmount += externalStats._sum.amount || 0;
    totalCount += externalStats._count.id || 0;
  }

  return {
    total: {
      amount: totalAmount,
      bonusAmount: totalBonusAmount,
      count: totalCount,
    },
    currencies: currencies,
    processors: processors,
  };
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
