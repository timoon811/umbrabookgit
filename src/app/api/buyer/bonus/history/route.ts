import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    // Имитация истории выплат бонусов
    const mockHistory = [
      {
        id: "1",
        period: "Август 2025 (1-15)",
        schemeName: "Основная схема 50/50",
        amount: 22500,
        status: "PAID",
        calculatedAt: new Date("2025-08-16"),
        paidAt: new Date("2025-08-17"),
        metrics: {
          totalProfit: 45000,
          bonusRate: 0.5,
          projects: ["Beauty Offers - Facebook", "Finance Offers - Google"]
        },
        payoutMethod: "Crypto",
        walletAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
      },
      {
        id: "2",
        period: "Август 2025 (16-31)",
        schemeName: "Основная схема 50/50",
        amount: 18750,
        status: "PAID",
        calculatedAt: new Date("2025-09-01"),
        paidAt: new Date("2025-09-02"),
        metrics: {
          totalProfit: 37500,
          bonusRate: 0.5,
          projects: ["Beauty Offers - Facebook", "Finance Offers - Google"]
        },
        payoutMethod: "Crypto",
        walletAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
      },
      {
        id: "3",
        period: "Июль 2025 (16-31)",
        schemeName: "Основная схема 50/50",
        amount: 15200,
        status: "PAID",
        calculatedAt: new Date("2025-08-01"),
        paidAt: new Date("2025-08-02"),
        metrics: {
          totalProfit: 30400,
          bonusRate: 0.5,
          projects: ["Beauty Offers - Facebook"]
        },
        payoutMethod: "Crypto",
        walletAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
      },
      {
        id: "4",
        period: "Июль 2025 (1-15)",
        schemeName: "Основная схема 50/50",
        amount: 12800,
        status: "PAID",
        calculatedAt: new Date("2025-07-16"),
        paidAt: new Date("2025-07-17"),
        metrics: {
          totalProfit: 25600,
          bonusRate: 0.5,
          projects: ["Beauty Offers - Facebook"]
        },
        payoutMethod: "Crypto",
        walletAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
      },
      {
        id: "5",
        period: "Сентябрь 2025 (1-15)",
        schemeName: "Основная схема 50/50",
        amount: 15750,
        status: "PENDING",
        calculatedAt: new Date("2025-09-16"),
        paidAt: null,
        metrics: {
          totalProfit: 31500,
          bonusRate: 0.5,
          projects: ["Beauty Offers - Facebook", "Finance Offers - Google", "Crypto Trading - Native"]
        },
        payoutMethod: "Crypto",
        walletAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
      }
    ];

    // Применение фильтров
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const period = url.searchParams.get('period');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    let filteredHistory = [...mockHistory];

    // Фильтр по статусу
    if (status && status !== 'all') {
      filteredHistory = filteredHistory.filter(entry => entry.status === status);
    }

    // Фильтр по периоду
    if (period) {
      filteredHistory = filteredHistory.filter(entry => 
        entry.period.toLowerCase().includes(period.toLowerCase())
      );
    }

    // Сортировка по дате (новые первыми)
    filteredHistory.sort((a, b) => 
      new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime()
    );

    // Лимит результатов
    if (limit > 0) {
      filteredHistory = filteredHistory.slice(0, limit);
    }

    return NextResponse.json({
      history: filteredHistory,
      total: filteredHistory.length,
      totalPaid: mockHistory
        .filter(entry => entry.status === 'PAID')
        .reduce((sum, entry) => sum + entry.amount, 0),
      totalPending: mockHistory
        .filter(entry => entry.status === 'PENDING')
        .reduce((sum, entry) => sum + entry.amount, 0)
    });
  } catch (error) {
    console.error("Error fetching bonus history:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки истории бонусов" },
      { status: 500 }
    );
  }
}

