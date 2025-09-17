import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiRequest } from "@/lib/api-auth";
import { requireAuth } from '@/lib/api-auth';

// GET /api/manager/goals - Получение активных планов для пользователей (упрощенная версия)
export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;

    // Временно возвращаем пустой массив для тестирования
    // После проверки работы интерфейса добавим полную логику
    const mockGoals = [
      {
        id: 'demo-earnings-goal',
        name: 'Недельный план заработка',
        description: 'Многоэтапные цели по заработку с фиксированными бонусами',
        goalTypeName: 'План на заработок',
        goalTypeUnit: '$',
        goalTypeType: 'EARNINGS',
        periodType: 'WEEKLY',
        currentValue: 150, // Текущий заработок $150
        totalStages: 4,
        completedStages: 1, // Достигнут 1 этап
        totalReward: 10, // Получено $10 за первый этап
        isCompleted: false,
        stages: [
          {
            id: 'stage-1',
            stage: 1,
            targetValue: 100,
            rewardAmount: 10,
            title: 'Старт',
            description: 'Первые $100 заработка',
            isCompleted: true
          },
          {
            id: 'stage-2', 
            stage: 2,
            targetValue: 250,
            rewardAmount: 25,
            title: 'Разгон',
            description: 'Достижение $250 заработка',
            isCompleted: false
          },
          {
            id: 'stage-3',
            stage: 3,
            targetValue: 500,
            rewardAmount: 50,
            title: 'Профессионал',
            description: 'Достижение $500 заработка',
            isCompleted: false
          },
          {
            id: 'stage-4',
            stage: 4,
            targetValue: 1000,
            rewardAmount: 100,
            title: 'Мастер',
            description: 'Достижение $1000 заработка',
            isCompleted: false
          }
        ],
        nextStage: {
          id: 'stage-2',
          stage: 2,
          targetValue: 250,
          rewardAmount: 25,
          title: 'Разгон',
          description: 'Достижение $250 заработка'
        }
      },
      {
        id: 'demo-deposits-goal',
        name: 'Дневной план депозитов',
        description: 'Лесенка наград за количество обработанных депозитов',
        goalTypeName: 'План на количество депозитов',
        goalTypeUnit: 'шт',
        goalTypeType: 'DEPOSITS_COUNT',
        periodType: 'DAILY',
        currentValue: 12, // 12 депозитов сегодня
        totalStages: 5,
        completedStages: 1, // Достигнут 1 этап
        totalReward: 5, // Получено $5 за первый этап
        isCompleted: false,
        stages: [
          {
            id: 'dep-stage-1',
            stage: 1,
            targetValue: 10,
            rewardAmount: 5,
            title: 'Первые 10',
            description: '10 депозитов за день',
            isCompleted: true
          },
          {
            id: 'dep-stage-2',
            stage: 2,
            targetValue: 25,
            rewardAmount: 15,
            title: 'Четверть сотни',
            description: '25 депозитов за день',
            isCompleted: false
          },
          {
            id: 'dep-stage-3',
            stage: 3,
            targetValue: 50,
            rewardAmount: 35,
            title: 'Полтинник',
            description: '50 депозитов за день',
            isCompleted: false
          }
        ],
        nextStage: {
          id: 'dep-stage-2',
          stage: 2,
          targetValue: 25,
          rewardAmount: 15,
          title: 'Четверть сотни',
          description: '25 депозитов за день'
        }
      }
    ];

    return NextResponse.json({
      goals: mockGoals,
      progress: {
        today: {
          earnings: 150,
          deposits: 12,
          hours: 6.5
        },
        week: {
          earnings: 150,
          deposits: 12,
          hours: 6.5
        },
        month: {
          earnings: 1250,
          deposits: 85,
          hours: 42
        }
      }
    });

  } catch (error: any) {
    console.error("Ошибка получения планов пользователя:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
