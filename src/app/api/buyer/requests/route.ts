import { NextRequest, NextResponse } from "next/server";
import { BuyerRequest } from "@/types/buyer";

export async function GET(request: NextRequest) {
  try {
    // Имитация данных заявок для тестирования
    const mockRequests: BuyerRequest[] = [
      {
        id: "1",
        buyerId: "buyer1",
        projectId: "1",
        type: "BUDGET",
        title: "Дополнительный бюджет для Facebook",
        description: "Требуется дополнительный бюджет $5000 для масштабирования успешных креативов",
        amount: 5000,
        deliveryMethod: "Facebook Ads Manager",
        status: "SUBMITTED",
        createdAt: new Date("2025-09-15T10:00:00"),
        updatedAt: new Date("2025-09-15T10:00:00"),
        project: {
          id: "1",
          name: "Beauty Offers - Facebook"
        }
      },
      {
        id: "2",
        buyerId: "buyer1",
        type: "PAYOUT",
        title: "Выплата за первую половину сентября",
        description: "Запрос на выплату бонуса за период 1-15 сентября",
        amount: 12500,
        payoutPeriod: "1-15",
        walletAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        status: "APPROVED",
        createdAt: new Date("2025-09-15T15:30:00"),
        updatedAt: new Date("2025-09-15T16:00:00")
      },
      {
        id: "3",
        buyerId: "buyer1",
        projectId: "2",
        type: "CONSUMABLES",
        title: "Антидетект браузеры и прокси",
        description: "Нужны 10 антидетект браузеров и 50 прокси для Finance проекта",
        status: "DRAFT",
        createdAt: new Date("2025-09-15T14:20:00"),
        updatedAt: new Date("2025-09-15T14:20:00"),
        project: {
          id: "2",
          name: "Finance Offers - Google"
        }
      },
      {
        id: "4",
        buyerId: "buyer1",
        type: "ACCESS",
        title: "Доступ к новому трекеру",
        description: "Нужен доступ к Keitaro для отслеживания конверсий",
        status: "FULFILLED",
        createdAt: new Date("2025-09-12T11:15:00"),
        updatedAt: new Date("2025-09-13T09:00:00"),
        fulfilledAt: new Date("2025-09-13T09:00:00"),
        adminComment: "Доступ выдан, данные отправлены в Telegram"
      },
      {
        id: "5",
        buyerId: "buyer1",
        type: "CUSTOM",
        title: "Консультация по нативной рекламе",
        description: "Нужна помощь в настройке нативных кампаний для нового GEO",
        status: "REJECTED",
        createdAt: new Date("2025-09-10T16:45:00"),
        updatedAt: new Date("2025-09-11T10:30:00"),
        adminComment: "Данный вид консультаций не предоставляется в рамках заявок"
      }
    ];

    // Применение фильтров
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const projectId = url.searchParams.get('projectId');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    let filteredRequests = [...mockRequests];

    // Фильтр по типу
    if (type && type !== 'all') {
      filteredRequests = filteredRequests.filter(req => req.type === type);
    }

    // Фильтр по статусу
    if (status && status !== 'all') {
      filteredRequests = filteredRequests.filter(req => req.status === status);
    }

    // Фильтр по проекту
    if (projectId && projectId !== 'all') {
      filteredRequests = filteredRequests.filter(req => req.projectId === projectId);
    }

    // Фильтр по дате от
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filteredRequests = filteredRequests.filter(req => new Date(req.createdAt) >= fromDate);
    }

    // Фильтр по дате до
    if (dateTo) {
      const toDate = new Date(dateTo);
      filteredRequests = filteredRequests.filter(req => new Date(req.createdAt) <= toDate);
    }

    // Поиск
    if (search) {
      const searchLower = search.toLowerCase();
      filteredRequests = filteredRequests.filter(req => 
        req.title.toLowerCase().includes(searchLower) ||
        req.description?.toLowerCase().includes(searchLower)
      );
    }

    // Сортировка
    filteredRequests.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'amount':
          aValue = a.amount || 0;
          bValue = b.amount || 0;
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
      requests: filteredRequests,
      total: filteredRequests.length
    });
  } catch (error) {
    console.error("Error fetching buyer requests:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки заявок" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Валидация данных
    if (!data.title || !data.type) {
      return NextResponse.json(
        { error: "Название и тип заявки обязательны" },
        { status: 400 }
      );
    }

    // Дополнительная валидация в зависимости от типа
    if (data.type === 'PAYOUT' && !data.payoutPeriod) {
      return NextResponse.json(
        { error: "Для заявок на выплату необходимо указать период" },
        { status: 400 }
      );
    }

    if ((data.type === 'BUDGET' || data.type === 'PAYOUT') && !data.amount) {
      return NextResponse.json(
        { error: "Для бюджетных заявок и выплат необходимо указать сумму" },
        { status: 400 }
      );
    }

    // Имитация создания заявки
    const newRequest: BuyerRequest = {
      id: Date.now().toString(),
      buyerId: "buyer1", // В реальном проекте получать из сессии
      projectId: data.projectId || undefined,
      type: data.type,
      title: data.title,
      description: data.description,
      amount: data.amount,
      deliveryMethod: data.deliveryMethod,
      payoutPeriod: data.payoutPeriod,
      walletAddress: data.walletAddress,
      items: data.items ? JSON.stringify(data.items) : undefined,
      status: "DRAFT",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return NextResponse.json(
      { request: newRequest, message: "Заявка создана успешно" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating buyer request:", error);
    return NextResponse.json(
      { error: "Ошибка создания заявки" },
      { status: 500 }
    );
  }
}

