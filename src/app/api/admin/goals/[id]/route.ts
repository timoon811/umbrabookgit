import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверяем авторизацию
        const authResult = await requireAdminAuth(request);
        
        if ('error' in authResult) {
          return authResult.error;
        }
    
        const { user } = authResult;
    
        const data = await request.json();
        const { name, description, stages } = data;
        const goalId = (await params).id;
    
        // Валидация
        if (!name || !stages || stages.length === 0) {
          return NextResponse.json(
            { error: 'Заполните все обязательные поля' },
            { status: 400 }
          );
        }
    
        // Проверяем существование плана
        const existingGoal = await prisma.user_goals.findUnique({
          where: { id: goalId },
          include: { stages: true }
        });
    
        if (!existingGoal) {
          return NextResponse.json(
            { error: 'План не найден' },
            { status: 404 }
          );
        }
    
        // Удаляем старые этапы и создаем новые
        await prisma.goal_stages.deleteMany({
          where: { goalId: goalId }
        });
    
        // Обновляем план
        const updatedGoal = await prisma.user_goals.update({
          where: { id: goalId },
          data: {
            name,
            description,
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
          message: 'План обновлен успешно',
          goal: updatedGoal
        });
    
      
  } catch (error: any) {
    console.error('Ошибка обновления плана:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления плана' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверяем авторизацию
        const authResult = await requireAdminAuth(request);
        
        if ('error' in authResult) {
          return authResult.error;
        }
    
        const { user } = authResult;
    
        const goalId = (await params).id;
    
        // Проверяем существование плана
        const existingGoal = await prisma.user_goals.findUnique({
          where: { id: goalId }
        });
    
        if (!existingGoal) {
          return NextResponse.json(
            { error: 'План не найден' },
            { status: 404 }
          );
        }
    
        // Удаляем план (этапы и достижения удалятся каскадно)
        await prisma.user_goals.delete({
          where: { id: goalId }
        });
    
    
        return NextResponse.json({
          message: 'План удален успешно'
        });
    
      
  } catch (error: any) {
    console.error('Ошибка удаления плана:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления плана' },
      { status: 500 }
    );
  }
}