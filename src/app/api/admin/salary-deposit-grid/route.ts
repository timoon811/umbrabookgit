import { checkAdminAuthUserId } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from '@/lib/api-auth';

// GET /api/admin/salary-deposit-grid
export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();

    // Получаем депозитную сетку
    const depositGrid = await prisma.salary_deposit_grid.findMany({
      where: { isActive: true },
      orderBy: { minAmount: "asc" }
    });

    return NextResponse.json({ depositGrid });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка получения сетки депозитов:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// POST /api/admin/salary-deposit-grid - Создание записи в сетке депозитов
export async function POST(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();
    const data = await request.json();

    const depositGridEntry = await prisma.salary_deposit_grid.create({
      data: {
        minAmount: parseFloat(data.minAmount),
        maxAmount: data.maxAmount ? parseFloat(data.maxAmount) : null,
        percentage: parseFloat(data.percentage),
        description: data.description,
        isActive: true,
      },
    });

    return NextResponse.json(depositGridEntry);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка создания записи сетки депозитов:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PUT /api/admin/salary-deposit-grid - Обновление записи в сетке депозитов
export async function PUT(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: "ID записи обязателен" }, { status: 400 });
    }

    const depositGridEntry = await prisma.salary_deposit_grid.update({
      where: { id: data.id },
      data: {
        minAmount: parseFloat(data.minAmount),
        maxAmount: data.maxAmount ? parseFloat(data.maxAmount) : null,
        percentage: parseFloat(data.percentage),
        description: data.description,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(depositGridEntry);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка обновления записи сетки депозитов:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// DELETE /api/admin/salary-deposit-grid - Удаление записи из сетки депозитов
export async function DELETE(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID записи обязателен" }, { status: 400 });
    }

    // Мягкое удаление - помечаем как неактивную
    await prisma.salary_deposit_grid.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка удаления записи сетки депозитов:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
