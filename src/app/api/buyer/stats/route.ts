import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { hasPermission } from "@/types/roles";
import { BuyerStats } from "@/types/buyer";
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    // Имитация проверки авторизации (пока что будет заглушка)
    // В реальном проекте здесь должна быть проверка сессии
    
    // Имитация данных для тестирования
    const mockStats: BuyerStats = {
      currentPeriod: {
        spend: 45000,
        deposits: 78000,
        profit: 33000,
        roas: 1.73,
        projectCount: 3
      },
      todayYesterday: {
        today: {
          spend: 2800,
          deposits: 4200,
          hasLog: true
        },
        yesterday: {
          spend: 2100,
          deposits: 3600,
          hasLog: true
        }
      },
      bonusPreview: {
        currentScheme: {
          id: "1",
          name: "50/50 схема",
          type: "FIFTY_FIFTY",
          percentage: 50,
          description: "50% от чистой прибыли",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        estimatedBonus: 16500,
        periodProfit: 33000
      },
      alerts: [
        {
          id: "1",
          type: "ROAS_DROP",
          title: "Падение ROAS в проекте Beauty Offers",
          description: "ROAS упал ниже 1.5 за последние 3 дня",
          severity: "HIGH",
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date(),
          project: {
            id: "proj1",
            name: "Beauty Offers"
          }
        },
        {
          id: "2",
          type: "MISSING_LOG",
          title: "Не заполнен дневник за позавчера",
          description: "Отсутствует дневник за 13.09.2025",
          severity: "MEDIUM",
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      recentRequests: [
        {
          id: "1",
          buyerId: "buyer1",
          type: "BUDGET",
          title: "Дополнительный бюджет для Facebook",
          amount: 5000,
          status: "SUBMITTED",
          createdAt: new Date(),
          updatedAt: new Date(),
          project: {
            id: "proj1",
            name: "Beauty Offers"
          }
        },
        {
          id: "2",
          buyerId: "buyer1",
          type: "PAYOUT",
          title: "Выплата за первую половину сентября",
          amount: 12500,
          status: "APPROVED",
          createdAt: new Date(),
          updatedAt: new Date(),
          payoutPeriod: "1-15"
        }
      ]
    };

    return NextResponse.json(mockStats);
  } catch (error) {
    console.error("Error fetching buyer stats:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки статистики" },
      { status: 500 }
    );
  }
}

