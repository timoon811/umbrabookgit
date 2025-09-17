import { NextRequest, NextResponse } from "next/server";
import { BuyerSignal } from "@/types/buyer";
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    // Имитация данных сигналов для тестирования
    const mockSignals: BuyerSignal[] = [
      {
        id: "1",
        buyerId: "buyer1",
        projectId: "1",
        type: "ROAS_DROPPED",
        severity: "CRITICAL",
        status: "ACTIVE",
        title: "Критическое падение ROAS в Beauty проекте",
        description: "ROAS упал до 0.8 за последние 4 часа. Проект может стать убыточным.",
        metadata: JSON.stringify({
          currentROAS: 0.8,
          previousROAS: 1.9,
          timeframe: "4 часа",
          spend: 2500,
          revenue: 2000,
          threshold: 1.3
        }),
        createdAt: new Date("2025-09-15T14:30:00"),
        project: {
          id: "1",
          name: "Beauty Offers - Facebook"
        }
      },
      {
        id: "2",
        buyerId: "buyer1",
        projectId: "2",
        type: "HIGH_CPA",
        severity: "HIGH",
        status: "ACTIVE",
        title: "Высокий CPA в Finance проекте",
        description: "CPA вырос до $180, что превышает целевой показатель на 50%.",
        metadata: JSON.stringify({
          currentCPA: 180,
          targetCPA: 120,
          increase: "50%",
          period: "последние 24 часа",
          deposits: 12
        }),
        createdAt: new Date("2025-09-15T12:15:00"),
        project: {
          id: "2",
          name: "Finance Offers - Google"
        }
      },
      {
        id: "3",
        buyerId: "buyer1",
        projectId: "1",
        type: "BUDGET_EXCEEDED",
        severity: "MEDIUM",
        status: "ACTIVE",
        title: "Превышен дневной бюджет",
        description: "Дневной бюджет превышен на 15%. Рекомендуется проверить настройки.",
        metadata: JSON.stringify({
          dailyBudget: 2500,
          currentSpend: 2875,
          excess: "15%",
          timeRemaining: "6 часов"
        }),
        createdAt: new Date("2025-09-15T10:45:00"),
        project: {
          id: "1",
          name: "Beauty Offers - Facebook"
        }
      },
      {
        id: "4",
        buyerId: "buyer1",
        type: "ACCOUNT_ISSUES",
        severity: "HIGH",
        status: "ACTIVE",
        title: "Проблемы с рекламным аккаунтом",
        description: "Аккаунт Facebook Ads находится на проверке. Реклама приостановлена.",
        metadata: JSON.stringify({
          accountId: "act_1234567890",
          platform: "Facebook",
          issue: "Account under review",
          estimatedResolve: "24-48 часов"
        }),
        createdAt: new Date("2025-09-15T09:20:00")
      },
      {
        id: "5",
        buyerId: "buyer1",
        projectId: "3",
        type: "NO_DEPOSITS",
        severity: "MEDIUM",
        status: "ACTIVE",
        title: "Нет депозитов более 6 часов",
        description: "В Crypto проекте не было депозитов уже 6 часов при активной рекламе.",
        metadata: JSON.stringify({
          lastDeposit: "6 часов назад",
          spend: 800,
          clicks: 245,
          registrations: 12,
          conversionRate: "0%"
        }),
        createdAt: new Date("2025-09-15T08:30:00"),
        project: {
          id: "3",
          name: "Crypto Trading - Native"
        }
      },
      {
        id: "6",
        buyerId: "buyer1",
        projectId: "1",
        type: "LOW_CONVERSION",
        severity: "LOW",
        status: "ACTIVE",
        title: "Снижение конверсии в регистрации",
        description: "Конверсия в регистрации упала до 2.1% с обычных 3.5%.",
        metadata: JSON.stringify({
          currentConversion: "2.1%",
          averageConversion: "3.5%",
          clicks: 1200,
          registrations: 25,
          period: "сегодня"
        }),
        createdAt: new Date("2025-09-15T07:15:00"),
        project: {
          id: "1",
          name: "Beauty Offers - Facebook"
        }
      }
    ];

    // Применение фильтров
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const severity = url.searchParams.get('severity');
    const status = url.searchParams.get('status');
    const projectId = url.searchParams.get('projectId');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    let filteredSignals = [...mockSignals];

    // Фильтр по типу
    if (type && type !== 'all') {
      filteredSignals = filteredSignals.filter(signal => signal.type === type);
    }

    // Фильтр по критичности
    if (severity && severity !== 'all') {
      filteredSignals = filteredSignals.filter(signal => signal.severity === severity);
    }

    // Фильтр по статусу
    if (status && status !== 'all') {
      filteredSignals = filteredSignals.filter(signal => signal.status === status);
    }

    // Фильтр по проекту
    if (projectId && projectId !== 'all') {
      filteredSignals = filteredSignals.filter(signal => signal.projectId === projectId);
    }

    // Поиск
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSignals = filteredSignals.filter(signal => 
        signal.title.toLowerCase().includes(searchLower) ||
        signal.description.toLowerCase().includes(searchLower)
      );
    }

    // Сортировка
    filteredSignals.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'severity':
          // Сортировка по критичности: CRITICAL > HIGH > MEDIUM > LOW
          const severityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          aValue = severityOrder[a.severity as keyof typeof severityOrder] || 0;
          bValue = severityOrder[b.severity as keyof typeof severityOrder] || 0;
          break;
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    return NextResponse.json({
      signals: filteredSignals,
      total: filteredSignals.length,
      summary: {
        critical: mockSignals.filter(s => s.severity === 'CRITICAL' && s.status === 'ACTIVE').length,
        high: mockSignals.filter(s => s.severity === 'HIGH' && s.status === 'ACTIVE').length,
        medium: mockSignals.filter(s => s.severity === 'MEDIUM' && s.status === 'ACTIVE').length,
        low: mockSignals.filter(s => s.severity === 'LOW' && s.status === 'ACTIVE').length,
        total: mockSignals.filter(s => s.status === 'ACTIVE').length
      }
    });
  } catch (error) {
    console.error("Error fetching buyer signals:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки сигналов" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
  

    const authResult = await requireAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    const data = await request.json();
    
    // Валидация данных
    if (!data.title || !data.type || !data.severity) {
      return NextResponse.json(
        { error: "Название, тип и критичность обязательны" },
        { status: 400 }
      );
    }

    // Имитация создания сигнала
    const newSignal: BuyerSignal = {
      id: Date.now().toString(),
      buyerId: "buyer1", // В реальном проекте получать из сессии
      projectId: data.projectId,
      type: data.type,
      severity: data.severity,
      status: "ACTIVE",
      title: data.title,
      description: data.description,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      createdAt: new Date()
    };

    return NextResponse.json(
      { signal: newSignal, message: "Сигнал создан успешно" },
      { status: 201 }
    );
  
  } catch (error) {
    console.error("Error creating buyer signal:", error);
    return NextResponse.json(
      { error: "Ошибка создания сигнала" },
      { status: 500 }
    );
  }
}

