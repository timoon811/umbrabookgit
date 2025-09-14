import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Проверка админских прав
async function checkAdminAuth(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  
  if (!token) {
    throw new Error("Не авторизован");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  
  if (!decoded || !decoded.userId) {
    throw new Error("Недействительный токен");
  }

  const user = await prisma.users.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  return decoded.userId;
}

// GET /api/admin/salary-monthly-bonus - Получение месячных бонусов
export async function GET(request: NextRequest) {
  try {
    await checkAdminAuth(request);

    const monthlyBonuses = await prisma.salary_monthly_bonus.findMany({
      where: { isActive: true },
      orderBy: { minAmount: 'asc' }
    });

    return NextResponse.json({ monthlyBonuses });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка получения месячных бонусов:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// POST /api/admin/salary-monthly-bonus - Создание месячного бонуса
export async function POST(request: NextRequest) {
  try {
    await checkAdminAuth(request);
    const data = await request.json();

    const monthlyBonus = await prisma.salary_monthly_bonus.create({
      data: {
        name: data.name,
        description: data.description,
        minAmount: parseFloat(data.minAmount),
        bonusPercent: parseFloat(data.bonusPercent),
        isActive: true,
      },
    });

    return NextResponse.json(monthlyBonus);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка создания месячного бонуса:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PUT /api/admin/salary-monthly-bonus - Обновление месячного бонуса
export async function PUT(request: NextRequest) {
  try {
    await checkAdminAuth(request);
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: "ID бонуса обязателен" }, { status: 400 });
    }

    const monthlyBonus = await prisma.salary_monthly_bonus.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        minAmount: parseFloat(data.minAmount),
        bonusPercent: parseFloat(data.bonusPercent),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(monthlyBonus);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка обновления месячного бонуса:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// DELETE /api/admin/salary-monthly-bonus - Удаление месячного бонуса
export async function DELETE(request: NextRequest) {
  try {
    await checkAdminAuth(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID бонуса обязателен" }, { status: 400 });
    }

    // Мягкое удаление - помечаем как неактивный
    await prisma.salary_monthly_bonus.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка удаления месячного бонуса:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
