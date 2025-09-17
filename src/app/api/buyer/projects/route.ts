import { NextRequest, NextResponse } from "next/server";
import { BuyerProject } from "@/types/buyer";
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    // Имитация данных проектов для тестирования
    const mockProjects: BuyerProject[] = [
      {
        id: "1",
        name: "Beauty Offers - Facebook",
        buyerId: "buyer1",
        offer: "Beauty Products",
        geo: "USA, CA",
        trafficSource: "Facebook Ads",
        attributionWindow: 1,
        attributionModel: "DATE_BASED",
        currency: "USD",
        status: "ACTIVE",
        isArchived: false,
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-09-15"),
        buyer: {
          id: "buyer1",
          name: "Иван Петров",
          email: "ivan@example.com"
        }
      },
      {
        id: "2",
        name: "Finance Offers - Google",
        buyerId: "buyer1",
        offer: "Loans & Credits",
        geo: "UK, AU",
        trafficSource: "Google Ads",
        attributionWindow: 7,
        attributionModel: "CLICK_BASED",
        currency: "USD",
        status: "ACTIVE",
        isArchived: false,
        createdAt: new Date("2025-08-15"),
        updatedAt: new Date("2025-09-14"),
        buyer: {
          id: "buyer1",
          name: "Иван Петров",
          email: "ivan@example.com"
        }
      },
      {
        id: "3",
        name: "Crypto Trading - Native",
        buyerId: "buyer1",
        offer: "Crypto Platform",
        geo: "DE, FR, IT",
        trafficSource: "Native Ads",
        attributionWindow: 3,
        attributionModel: "DATE_BASED",
        currency: "USD",
        status: "PAUSED",
        stopConditions: JSON.stringify({
          maxDailySpend: 1000,
          minROAS: 1.3
        }),
        isArchived: false,
        createdAt: new Date("2025-07-20"),
        updatedAt: new Date("2025-09-10"),
        buyer: {
          id: "buyer1",
          name: "Иван Петров",
          email: "ivan@example.com"
        }
      }
    ];

    // Применение фильтров
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sortBy') || 'name';
    const sortOrder = url.searchParams.get('sortOrder') || 'asc';

    let filteredProjects = [...mockProjects];

    // Фильтр по статусу
    if (status && status !== 'all') {
      filteredProjects = filteredProjects.filter(p => p.status === status);
    }

    // Поиск
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProjects = filteredProjects.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.offer?.toLowerCase().includes(searchLower) ||
        p.geo?.toLowerCase().includes(searchLower)
      );
    }

    // Сортировка
    filteredProjects.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    return NextResponse.json({
      projects: filteredProjects,
      total: filteredProjects.length
    });
  } catch (error) {
    console.error("Error fetching buyer projects:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки проектов" },
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
    if (!data.name || !data.currency) {
      return NextResponse.json(
        { error: "Название и валюта обязательны" },
        { status: 400 }
      );
    }

    // Имитация создания проекта
    const newProject: BuyerProject = {
      id: Date.now().toString(),
      name: data.name,
      buyerId: "buyer1", // В реальном проекте получать из сессии
      offer: data.offer,
      geo: data.geo,
      trafficSource: data.trafficSource,
      attributionWindow: data.attributionWindow || 1,
      attributionModel: data.attributionModel || "DATE_BASED",
      currency: data.currency,
      status: "ACTIVE",
      stopConditions: data.stopConditions,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return NextResponse.json(
      { project: newProject, message: "Проект создан успешно" },
      { status: 201 }
    );
  
  } catch (error) {
    console.error("Error creating buyer project:", error);
    return NextResponse.json(
      { error: "Ошибка создания проекта" },
      { status: 500 }
    );
  }
}

