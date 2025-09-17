import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    // Имитация прогноза бонуса на основе текущих показателей
    const mockForecast = {
      period: "Сентябрь 2025",
      estimatedAmount: 18750,
      confidence: 85,
      basedOnDays: 15,
      totalDaysInPeriod: 30,
      currentProfit: 25000,
      projectedProfit: 50000,
      breakdown: {
        "Основная схема 50/50": {
          currentBonus: 12500,
          projectedBonus: 25000,
          confidence: 90
        },
        "Тирная система для новых проектов": {
          currentBonus: 3200,
          projectedBonus: 8000,
          confidence: 75
        }
      },
      factors: [
        "Хорошая динамика ROAS в основных проектах",
        "Стабильные депозиты в Finance офферах", 
        "Новый проект показывает потенциал роста"
      ],
      recommendations: [
        "Продолжить масштабирование Beauty проекта",
        "Оптимизировать Finance кампании для повышения ROAS",
        "Тестировать новые креативы для Crypto проекта"
      ]
    };

    return NextResponse.json({
      forecast: mockForecast
    });
  } catch (error) {
    console.error("Error generating bonus forecast:", error);
    return NextResponse.json(
      { error: "Ошибка создания прогноза бонуса" },
      { status: 500 }
    );
  }
}

