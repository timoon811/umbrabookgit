import { NextRequest, NextResponse } from "next/server";
import { BuyerDailyLog } from "@/types/buyer";

export async function GET(request: NextRequest) {
  try {
    // Имитация данных дневников для тестирования
    const mockLogs: BuyerDailyLog[] = [
      {
        id: "1",
        buyerId: "buyer1",
        projectId: "1",
        date: new Date("2025-09-14"),
        spend: 2100,
        ftdCount: 12,
        ftdAmount: 2400,
        redCount: 8,
        redAmount: 1200,
        totalDeposits: 3600,
        averageCheck: 200,
        registrations: 45,
        clicks: 1250,
        notes: "Хороший день, высокая конверсия",
        status: "APPROVED",
        createdAt: new Date("2025-09-14T18:00:00"),
        updatedAt: new Date("2025-09-14T18:00:00"),
        project: {
          id: "1",
          name: "Beauty Offers - Facebook"
        }
      },
      {
        id: "2",
        buyerId: "buyer1",
        projectId: "2",
        date: new Date("2025-09-14"),
        spend: 1800,
        ftdCount: 8,
        ftdAmount: 1600,
        redCount: 5,
        redAmount: 800,
        totalDeposits: 2400,
        averageCheck: 180,
        registrations: 32,
        clicks: 980,
        notes: "Средний день",
        status: "APPROVED",
        createdAt: new Date("2025-09-14T19:00:00"),
        updatedAt: new Date("2025-09-14T19:00:00"),
        project: {
          id: "2",
          name: "Finance Offers - Google"
        }
      },
      {
        id: "3",
        buyerId: "buyer1",
        projectId: "1",
        date: new Date("2025-09-13"),
        spend: 2300,
        ftdCount: 10,
        ftdAmount: 2000,
        redCount: 6,
        redAmount: 900,
        totalDeposits: 2900,
        averageCheck: 181,
        registrations: 38,
        clicks: 1100,
        notes: "Тестировали новые креативы",
        status: "LOCKED",
        createdAt: new Date("2025-09-13T20:00:00"),
        updatedAt: new Date("2025-09-13T20:00:00"),
        project: {
          id: "1",
          name: "Beauty Offers - Facebook"
        }
      },
      {
        id: "4",
        buyerId: "buyer1",
        projectId: "1",
        date: new Date("2025-09-15"),
        spend: 1500,
        ftdCount: 5,
        ftdAmount: 1000,
        redCount: 3,
        redAmount: 450,
        totalDeposits: 1450,
        averageCheck: 181,
        registrations: 22,
        clicks: 750,
        notes: "Выходной день, меньше трафика",
        status: "DRAFT",
        createdAt: new Date("2025-09-15T12:00:00"),
        updatedAt: new Date("2025-09-15T12:00:00"),
        project: {
          id: "1",
          name: "Beauty Offers - Facebook"
        }
      }
    ];

    // Применение фильтров
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const status = url.searchParams.get('status');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sortBy') || 'date';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    let filteredLogs = [...mockLogs];

    // Фильтр по проекту
    if (projectId && projectId !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.projectId === projectId);
    }

    // Фильтр по статусу
    if (status && status !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.status === status);
    }

    // Фильтр по дате от
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filteredLogs = filteredLogs.filter(log => new Date(log.date) >= fromDate);
    }

    // Фильтр по дате до
    if (dateTo) {
      const toDate = new Date(dateTo);
      filteredLogs = filteredLogs.filter(log => new Date(log.date) <= toDate);
    }

    // Поиск
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.project?.name.toLowerCase().includes(searchLower) ||
        log.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Сортировка
    filteredLogs.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'spend':
          aValue = a.spend;
          bValue = b.spend;
          break;
        case 'deposits':
          aValue = a.totalDeposits;
          bValue = b.totalDeposits;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
      }

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    return NextResponse.json({
      logs: filteredLogs,
      total: filteredLogs.length
    });
  } catch (error) {
    console.error("Error fetching daily logs:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки дневников" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Валидация данных
    if (!data.projectId || !data.date) {
      return NextResponse.json(
        { error: "Проект и дата обязательны" },
        { status: 400 }
      );
    }

    // Проверяем, что дата не в будущем
    const logDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (logDate >= today) {
      return NextResponse.json(
        { error: "Нельзя создавать дневники на сегодня или будущие даты" },
        { status: 400 }
      );
    }

    // Расчет итоговых значений
    const totalDeposits = (data.ftdAmount || 0) + (data.redAmount || 0);
    const totalCount = (data.ftdCount || 0) + (data.redCount || 0);
    const averageCheck = totalCount > 0 ? totalDeposits / totalCount : 0;

    // Имитация создания дневника
    const newLog: BuyerDailyLog = {
      id: Date.now().toString(),
      buyerId: "buyer1", // В реальном проекте получать из сессии
      projectId: data.projectId,
      date: new Date(data.date),
      spend: data.spend || 0,
      ftdCount: data.ftdCount || 0,
      ftdAmount: data.ftdAmount || 0,
      redCount: data.redCount || 0,
      redAmount: data.redAmount || 0,
      totalDeposits: totalDeposits,
      averageCheck: averageCheck,
      registrations: data.registrations || 0,
      clicks: data.clicks || 0,
      notes: data.notes || '',
      status: "DRAFT",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return NextResponse.json(
      { log: newLog, message: "Дневник создан успешно" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating daily log:", error);
    return NextResponse.json(
      { error: "Ошибка создания дневника" },
      { status: 500 }
    );
  }
}

