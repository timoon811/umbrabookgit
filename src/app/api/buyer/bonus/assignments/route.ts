import { NextRequest, NextResponse } from "next/server";
import { BuyerBonusAssignment } from "@/types/buyer";

export async function GET(request: NextRequest) {
  try {
    // Имитация данных активных схем бонусов
    const mockAssignments: BuyerBonusAssignment[] = [
      {
        id: "1",
        buyerId: "buyer1",
        bonusSchemeId: "scheme1",
        assignedAt: new Date("2025-09-01"),
        isActive: true,
        currentBonus: 12500,
        bonusScheme: {
          id: "scheme1",
          name: "Основная схема 50/50",
          type: "FIFTY_FIFTY",
          description: "50% от прибыли проекта после покрытия всех расходов",
          configuration: JSON.stringify({
            profitShare: 0.5,
            minProfit: 1000,
            maxBonus: 50000,
            payoutPeriod: "bi_monthly"
          }),
          isActive: true,
          createdAt: new Date("2025-08-01"),
          updatedAt: new Date("2025-08-01")
        }
      },
      {
        id: "2",
        buyerId: "buyer1",
        bonusSchemeId: "scheme2",
        assignedAt: new Date("2025-09-10"),
        isActive: true,
        currentBonus: 3200,
        bonusScheme: {
          id: "scheme2",
          name: "Тирная система для новых проектов",
          type: "TIERED",
          description: "Прогрессивная схема с увеличением процента при росте прибыли",
          configuration: JSON.stringify({
            tiers: [
              { minProfit: 0, maxProfit: 5000, rate: 0.2 },
              { minProfit: 5000, maxProfit: 15000, rate: 0.3 },
              { minProfit: 15000, maxProfit: 50000, rate: 0.4 },
              { minProfit: 50000, maxProfit: null, rate: 0.5 }
            ],
            payoutPeriod: "bi_monthly"
          }),
          isActive: true,
          createdAt: new Date("2025-09-01"),
          updatedAt: new Date("2025-09-01")
        }
      }
    ];

    return NextResponse.json({
      assignments: mockAssignments,
      total: mockAssignments.length
    });
  } catch (error) {
    console.error("Error fetching bonus assignments:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки схем бонусов" },
      { status: 500 }
    );
  }
}

