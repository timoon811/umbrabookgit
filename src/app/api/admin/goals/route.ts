import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию
      const authResult = await requireAdminAuth(request);
      
        if ('error' in authResult) {
        return authResult.error;
      }
    
      
        const { user } = authResult;
    
        const goalTypes = await prisma.goal_types.findMany({
          orderBy: { name: 'asc' }
        });
    
        // Получаем все месячные цели с этапами
        const goals = await prisma.user_goals.findMany({
          where: {
            periodType: 'MONTHLY'
          },
          include: {
            goalType: true,
            stages: {
              orderBy: { stage: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
    
        // Форматируем данные для фронтенда
        const formattedGoals = goals.map(goal => ({
          id: goal.id,
          name: goal.name,
          description: goal.description,
          goalTypeId: goal.goalTypeId,
          goalTypeName: goal.goalType.name,
          goalTypeUnit: goal.goalType.unit,
          goalTypeType: goal.goalType.type,
          periodType: goal.periodType,
          isActive: goal.isActive,
          stages: goal.stages.map(stage => ({
            id: stage.id,
            stage: stage.stage,
            targetValue: stage.targetValue,
            rewardAmount: stage.rewardAmount,
            title: stage.title,
            description: stage.description,
            isActive: stage.isActive
          })),
          createdAt: goal.createdAt.toISOString(),
          updatedAt: goal.updatedAt.toISOString()
        }));
    
        return NextResponse.json({
          goalTypes: goalTypes,
          goals: formattedGoals
        });
    
      
  } catch (error: any) {
    console.error('Ошибка загрузки планов:', error);
    return NextResponse.json(
      { error: 'Ошибка загрузки планов' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const authResult = await requireAdminAuth(request);
    
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;

    const data = await request.json();
    const { name, description, goalTypeId, stages } = data;

    // Валидация
    if (!name || !goalTypeId || !stages || stages.length === 0) {
      return NextResponse.json(
        { error: 'Заполните все обязательные поля' },
        { status: 400 }
      );
    }

    // Проверяем тип цели
    const goalType = await prisma.goal_types.findUnique({
      where: { id: goalTypeId }
    });

    if (!goalType) {
      return NextResponse.json(
        { error: 'Тип цели не найден' },
        { status: 400 }
      );
    }

    // Создаем план с этапами
    const goal = await prisma.user_goals.create({
      data: {
        name,
        description,
        goalTypeId,
        periodType: 'MONTHLY',
        stages: {
          create: stages.map((stage: any, index: number) => ({
            stage: index + 1,
            targetValue: stage.targetValue,
            rewardAmount: stage.rewardAmount,
            title: stage.title,
            description: stage.description || ''
          }))
        }
      },
      include: {
        goalType: true,
        stages: {
          orderBy: { stage: 'asc' }
        }
      }
    });


    return NextResponse.json({
      message: 'План создан успешно',
      goal: goal
    });

  } catch (error: any) {
    console.error('Ошибка создания плана:', error);
    return NextResponse.json(
      { error: 'Ошибка создания плана' },
      { status: 500 }
    );
  }
}