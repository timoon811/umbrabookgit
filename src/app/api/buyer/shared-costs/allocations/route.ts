import { NextRequest, NextResponse } from "next/server";
import { SharedCostAllocation } from "@/types/buyer";
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    // Имитация данных аллокаций для текущего байера
    const mockAllocations: SharedCostAllocation[] = [
      {
        id: "1",
        buyerId: "buyer1",
        sharedCostId: "1",
        allocationType: "PERCENTAGE",
        allocationValue: 0.25, // 25%
        allocatedAmount: 625, // 25% от 2500
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-09-01"),
        sharedCost: {
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
        }
      },
      {
        id: "2",
        buyerId: "buyer1", 
        sharedCostId: "2",
        allocationType: "FIXED_AMOUNT",
        allocationValue: 150, // Фиксированная сумма
        allocatedAmount: 150,
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-09-01"),
        sharedCost: {
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
        }
      },
      {
        id: "3",
        buyerId: "buyer1",
        sharedCostId: "3", 
        allocationType: "PROJECT_BASED",
        allocationValue: 0.3, // 30% на основе количества проектов
        allocatedAmount: 360, // 30% от 1200
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-09-01"),
        sharedCost: {
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
        }
      },
      {
        id: "4",
        buyerId: "buyer1",
        sharedCostId: "4",
        allocationType: "PERCENTAGE", 
        allocationValue: 0.2, // 20%
        allocatedAmount: 120, // 20% от 600
        createdAt: new Date("2025-09-01"),
        updatedAt: new Date("2025-09-01"),
        sharedCost: {
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
        }
      }
    ];

    return NextResponse.json({
      allocations: mockAllocations,
      total: mockAllocations.length,
      totalAllocated: mockAllocations.reduce((sum, allocation) => sum + allocation.allocatedAmount, 0)
    });
  } catch (error) {
    console.error("Error fetching shared cost allocations:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки аллокаций" },
      { status: 500 }
    );
  }
}

