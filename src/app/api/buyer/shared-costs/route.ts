import { NextRequest, NextResponse } from "next/server";
import { SharedCost } from "@/types/buyer";

export async function GET(request: NextRequest) {
  try {
    // Имитация данных общих расходов
    const mockSharedCosts: SharedCost[] = [
      {
        id: "1",
        name: "Серверы и хостинг",
        description: "AWS инфраструктура для всех проектов команды",
        category: "INFRASTRUCTURE",
        totalAmount: 2500,
        period: "Сентябрь 2025",
        status: "ACTIVE",
        participants: 5,
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-09-01")
      },
      {
        id: "2", 
        name: "Антидетект браузеры",
        description: "Лицензии на Multilogin для всей команды",
        category: "TOOLS",
        totalAmount: 800,
        period: "Сентябрь 2025",
        status: "ACTIVE",
        participants: 8,
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-09-01")
      },
      {
        id: "3",
        name: "Прокси-серверы",
        description: "Ротационные прокси для всех проектов",
        category: "PROXIES", 
        totalAmount: 1200,
        period: "Сентябрь 2025",
        status: "ACTIVE",
        participants: 6,
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-09-01")
      },
      {
        id: "4",
        name: "Трекеры и аналитика",
        description: "Keitaro, Voluum и другие инструменты аналитики",
        category: "TOOLS",
        totalAmount: 600,
        period: "Сентябрь 2025", 
        status: "ACTIVE",
        participants: 4,
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-09-01")
      },
      {
        id: "5",
        name: "Домены и SSL",
        description: "Регистрация доменов и SSL сертификаты",
        category: "DOMAINS",
        totalAmount: 300,
        period: "Сентябрь 2025",
        status: "ACTIVE", 
        participants: 3,
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-09-01")
      }
    ];

    return NextResponse.json({
      costs: mockSharedCosts,
      total: mockSharedCosts.length,
      totalAmount: mockSharedCosts.reduce((sum, cost) => sum + cost.totalAmount, 0)
    });
  } catch (error) {
    console.error("Error fetching shared costs:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки общих расходов" },
      { status: 500 }
    );
  }
}

