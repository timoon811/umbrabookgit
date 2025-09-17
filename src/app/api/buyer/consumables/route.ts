import { NextRequest, NextResponse } from "next/server";
import { ConsumableItem } from "@/types/buyer";
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    // Имитация каталога расходников
    const mockConsumables: ConsumableItem[] = [
      {
        id: "1",
        name: "Premium IPv4 Прокси",
        description: "Высококачественные IPv4 прокси для Facebook Ads",
        category: "PROXIES",
        unitPrice: 3.5,
        unit: "шт/месяц",
        availableQuantity: 150,
        tags: ["facebook", "ipv4", "premium"],
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-09-01")
      },
      {
        id: "2",
        name: "Residential Прокси",
        description: "Резидентные прокси для Google Ads и нативной рекламы",
        category: "PROXIES", 
        unitPrice: 12.0,
        unit: "GB",
        availableQuantity: 500,
        tags: ["google", "residential", "native"],
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-09-01")
      },
      {
        id: "3",
        name: "Facebook BM аккаунты",
        description: "Прогретые Business Manager аккаунты для Facebook",
        category: "ACCOUNTS",
        unitPrice: 45.0,
        unit: "шт",
        availableQuantity: 25,
        tags: ["facebook", "bm", "warmed"],
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-09-01")
      },
      {
        id: "4",
        name: "Google Ads аккаунты",
        description: "Верифицированные Google Ads аккаунты с историей",
        category: "ACCOUNTS",
        unitPrice: 80.0,
        unit: "шт",
        availableQuantity: 15,
        tags: ["google", "verified", "history"],
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-09-01")
      },
      {
        id: "5",
        name: "Premium домены",
        description: "Старые домены с чистой историей для лендингов",
        category: "DOMAINS",
        unitPrice: 25.0,
        unit: "шт/год",
        availableQuantity: 40,
        tags: ["aged", "clean", "landing"],
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-09-01")
      },
      {
        id: "6",
        name: "Multilogin лицензии",
        description: "Лицензии на антидетект браузер Multilogin",
        category: "TOOLS",
        unitPrice: 120.0,
        unit: "шт/месяц",
        availableQuantity: 10,
        tags: ["antidetect", "browser", "multilogin"],
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-09-01")
      },
      {
        id: "7",
        name: "AdsPower лицензии",
        description: "Лицензии на антидетект браузер AdsPower",
        category: "TOOLS",
        unitPrice: 50.0,
        unit: "шт/месяц", 
        availableQuantity: 20,
        tags: ["antidetect", "browser", "adspower"],
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-09-01")
      },
      {
        id: "8",
        name: "Keitaro трекер",
        description: "Лицензии на трекер Keitaro для аналитики",
        category: "TOOLS",
        unitPrice: 89.0,
        unit: "шт/месяц",
        availableQuantity: 5,
        tags: ["tracker", "analytics", "keitaro"],
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-09-01")
      },
      {
        id: "9",
        name: "Telegram аккаунты",
        description: "Прогретые Telegram аккаунты для арбитража",
        category: "ACCOUNTS",
        unitPrice: 15.0,
        unit: "шт",
        availableQuantity: 60,
        tags: ["telegram", "warmed", "arbitrage"],
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-09-01")
      },
      {
        id: "10",
        name: "TikTok Ads аккаунты",
        description: "Верифицированные TikTok Ads аккаунты",
        category: "ACCOUNTS", 
        unitPrice: 120.0,
        unit: "шт",
        availableQuantity: 8,
        tags: ["tiktok", "verified", "ads"],
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-09-01")
      }
    ];

    // Применение фильтров
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const minPrice = parseFloat(url.searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(url.searchParams.get('maxPrice') || '999999');

    let filteredItems = [...mockConsumables];

    // Фильтр по категории
    if (category && category !== 'all') {
      filteredItems = filteredItems.filter(item => item.category === category);
    }

    // Фильтр по цене
    filteredItems = filteredItems.filter(item => 
      item.unitPrice >= minPrice && item.unitPrice <= maxPrice
    );

    // Поиск
    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return NextResponse.json({
      items: filteredItems,
      total: filteredItems.length,
      categories: {
        PROXIES: mockConsumables.filter(i => i.category === 'PROXIES').length,
        ACCOUNTS: mockConsumables.filter(i => i.category === 'ACCOUNTS').length,
        DOMAINS: mockConsumables.filter(i => i.category === 'DOMAINS').length,
        TOOLS: mockConsumables.filter(i => i.category === 'TOOLS').length
      }
    });
  } catch (error) {
    console.error("Error fetching consumables:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки каталога расходников" },
      { status: 500 }
    );
  }
}

