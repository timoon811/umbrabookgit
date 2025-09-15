import { NextRequest, NextResponse } from "next/server";
import { BuyerProject } from "@/types/buyer";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    
    // Имитация подробных данных проекта
    const mockProjects: { [key: string]: BuyerProject } = {
      "1": {
        id: "1",
        name: "Beauty Offers - Facebook",
        buyerId: "buyer1",
        offer: "Beauty Products & Skincare",
        geo: "USA, CA, AU, UK",
        trafficSource: "Facebook Ads",
        attributionWindow: 1,
        attributionModel: "DATE_BASED",
        currency: "USD",
        status: "ACTIVE",
        stopConditions: JSON.stringify({
          maxDailySpend: 2500,
          minROAS: 1.3,
          maxCPA: 80
        }),
        isArchived: false,
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-09-15"),
        buyer: {
          id: "buyer1",
          name: "Иван Петров",
          email: "ivan@example.com"
        },
        // Дополнительные поля для детального просмотра
        description: "Основной проект по продвижению beauty-офферов для женской аудитории 25-45 лет через Facebook Ads. Показывает стабильную прибыль и высокий ROAS.",
        targetAudience: "Женщины 25-45 лет, интересующиеся красотой и здоровьем",
        landingPages: ["lp1.example.com", "lp2.example.com"],
        creatives: ["video_ad_1.mp4", "carousel_ad_1.jpg", "story_ad_1.mp4"],
        monthlyBudget: 75000,
        dailyBudgetCap: 2500,
        targetROAS: 1.5,
        currentROAS: 1.91,
        totalSpend: 35420,
        totalRevenue: 67800,
        totalProfit: 32380,
        conversionRate: 3.2,
        averageOrderValue: 315.5,
        tags: ["beauty", "skincare", "female", "tier1"]
      },
      "2": {
        id: "2",
        name: "Finance Offers - Google",
        buyerId: "buyer1",
        offer: "Loans & Credits Platform",
        geo: "UK, AU, DE, FR",
        trafficSource: "Google Ads",
        attributionWindow: 7,
        attributionModel: "CLICK_BASED",
        currency: "USD",
        status: "ACTIVE",
        stopConditions: JSON.stringify({
          maxDailySpend: 3000,
          minROAS: 1.4,
          maxCPA: 120
        }),
        isArchived: false,
        createdAt: new Date("2025-08-15"),
        updatedAt: new Date("2025-09-14"),
        buyer: {
          id: "buyer1",
          name: "Иван Петров",
          email: "ivan@example.com"
        },
        description: "Финансовые офферы через Google Ads для Tier-1 стран. Требует постоянного мониторинга комплаенса и высоких стандартов качества.",
        targetAudience: "Взрослые 30-55 лет, интересующиеся финансовыми услугами",
        landingPages: ["finance-lp1.example.com", "loans-lp2.example.com"],
        creatives: ["finance_banner_1.jpg", "loan_ad_1.mp4"],
        monthlyBudget: 90000,
        dailyBudgetCap: 3000,
        targetROAS: 1.6,
        currentROAS: 1.40,
        totalSpend: 68200,
        totalRevenue: 95400,
        totalProfit: 27200,
        conversionRate: 2.8,
        averageOrderValue: 425.2,
        tags: ["finance", "loans", "tier1", "compliance"]
      },
      "3": {
        id: "3",
        name: "Crypto Trading - Native",
        buyerId: "buyer1",
        offer: "Crypto Trading Platform",
        geo: "DE, FR, IT, ES",
        trafficSource: "Native Ads",
        attributionWindow: 3,
        attributionModel: "DATE_BASED",
        currency: "USD",
        status: "PAUSED",
        stopConditions: JSON.stringify({
          maxDailySpend: 1000,
          minROAS: 1.3,
          maxCPA: 150
        }),
        isArchived: false,
        createdAt: new Date("2025-07-20"),
        updatedAt: new Date("2025-09-10"),
        buyer: {
          id: "buyer1",
          name: "Иван Петров",
          email: "ivan@example.com"
        },
        description: "Криптовалютные офферы через нативную рекламу для европейской аудитории. Приостановлен из-за низкой производительности.",
        targetAudience: "Мужчины 25-50 лет, интересующиеся криптовалютами и трейдингом",
        landingPages: ["crypto-lp1.example.com"],
        creatives: ["crypto_native_1.jpg", "trading_article_1.html"],
        monthlyBudget: 30000,
        dailyBudgetCap: 1000,
        targetROAS: 1.8,
        currentROAS: 1.45,
        totalSpend: 12800,
        totalRevenue: 18600,
        totalProfit: 5800,
        conversionRate: 4.1,
        averageOrderValue: 285.8,
        tags: ["crypto", "trading", "native", "europe"]
      }
    };

    const project = mockProjects[projectId];
    
    if (!project) {
      return NextResponse.json(
        { error: "Проект не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      project: project
    });
  } catch (error) {
    console.error("Error fetching buyer project:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки проекта" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const data = await request.json();
    
    // Валидация данных
    if (!data.name || !data.currency) {
      return NextResponse.json(
        { error: "Название и валюта обязательны" },
        { status: 400 }
      );
    }

    // Имитация обновления проекта
    const updatedProject = {
      id: projectId,
      ...data,
      updatedAt: new Date()
    };

    return NextResponse.json(
      { project: updatedProject, message: "Проект обновлен успешно" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating buyer project:", error);
    return NextResponse.json(
      { error: "Ошибка обновления проекта" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    
    // Проверяем, что проект можно удалить (нет активных дневников)
    // В реальном проекте здесь проверка из БД
    
    return NextResponse.json(
      { message: "Проект архивирован успешно" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error archiving buyer project:", error);
    return NextResponse.json(
      { error: "Ошибка архивирования проекта" },
      { status: 500 }
    );
  }
}

