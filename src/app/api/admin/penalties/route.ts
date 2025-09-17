import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDayStartUTC3, getShiftType } from "@/lib/time-utils";
import { requireAdminAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    const { searchParams } = new URL(request.url);
    const processorId = searchParams.get('processorId');
    const status = searchParams.get('status');

    const where: any = {};
    if (processorId) where.processorId = processorId;
    if (status) where.status = status;

    const penalties = await prisma.shift_penalties.findMany({
      where,
      include: {
        manager: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ penalties });
  } catch (error) {
    console.error('Ошибка получения штрафов:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    const data = await request.json();
    const { processorId, shiftType, shiftDate, reason, adminComment } = data;

    if (!processorId || !shiftType || !shiftDate) {
      return NextResponse.json(
        { error: "Обязательные поля: processorId, shiftType, shiftDate" },
        { status: 400 }
      );
    }

    // Проверяем, что менеджер существует
    const manager = await prisma.users.findUnique({
      where: { id: processorId }
    });

    if (!manager || manager.role !== 'PROCESSOR') {
      return NextResponse.json(
        { error: "Менеджер не найден" },
        { status: 404 }
      );
    }

    // Проверяем, нет ли уже штрафа за эту смену
    const existingPenalty = await prisma.shift_penalties.findFirst({
      where: {
        processorId,
        shiftType: shiftType.toUpperCase(),
        shiftDate: new Date(shiftDate)
      }
    });

    if (existingPenalty) {
      return NextResponse.json(
        { error: "Штраф за эту смену уже существует" },
        { status: 400 }
      );
    }

    // Создаем штраф
    const penalty = await prisma.shift_penalties.create({
      data: {
        processorId,
        type: 'SHIFT_MISS',
        shiftType: shiftType.toUpperCase(),
        shiftDate: new Date(shiftDate),
        amount: -50.0, // Штраф за пропуск смены
        reason: reason || 'Пропуск смены',
        adminComment,
        status: 'APPLIED',
        appliedAt: new Date()
      }
    });


    return NextResponse.json(penalty, { status: 201 });
  } catch (error) {
    console.error('Ошибка создания штрафа:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    const data = await request.json();
    const { id, updates } = data;

    const updatedPenalty = await prisma.shift_penalties.update({
      where: { id },
      data: updates
    });

    return NextResponse.json(updatedPenalty);
  } catch (error) {
    console.error('Ошибка обновления штрафа:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
