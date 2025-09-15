import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";

// GET /api/admin/salary-monthly-bonus - Получение месячных бонусов
export async function GET(request: NextRequest) {
  const authResult = await requireAdminAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const monthlyBonuses = await prisma.salary_monthly_bonus.findMany({
      where: { isActive: true },
      orderBy: { minAmount: 'asc' }
    });

    return NextResponse.json({ monthlyBonuses });
  } catch (error) {
    console.error("Ошибка получения месячных бонусов:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// POST /api/admin/salary-monthly-bonus - Создание месячного бонуса
export async function POST(request: NextRequest) {
  const authResult = await requireAdminAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const data = await request.json();
    const { name, description, minAmount, bonusPercent } = data;

    // Валидация
    if (!name || !minAmount || !bonusPercent) {
      return NextResponse.json(
        { error: "Обязательные поля: name, minAmount, bonusPercent" },
        { status: 400 }
      );
    }

    if (minAmount <= 0) {
      return NextResponse.json(
        { error: "Минимальная сумма должна быть больше 0" },
        { status: 400 }
      );
    }

    if (bonusPercent <= 0 || bonusPercent > 100) {
      return NextResponse.json(
        { error: "Процент бонуса должен быть от 0.1 до 100" },
        { status: 400 }
      );
    }

    // Проверяем уникальность minAmount
    const existingPlan = await prisma.salary_monthly_bonus.findFirst({
      where: {
        minAmount: parseFloat(minAmount.toString()),
        isActive: true
      }
    });

    if (existingPlan) {
      return NextResponse.json(
        { error: `План с суммой $${minAmount.toLocaleString()} уже существует` },
        { status: 400 }
      );
    }

    const monthlyBonus = await prisma.salary_monthly_bonus.create({
      data: {
        name: name.toString(),
        description: description?.toString() || null,
        minAmount: parseFloat(minAmount.toString()),
        bonusPercent: parseFloat(bonusPercent.toString()),
        isActive: true
      }
    });

    return NextResponse.json(monthlyBonus, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания месячного бонуса:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/salary-monthly-bonus - Обновление месячного бонуса
export async function PUT(request: NextRequest) {
  const authResult = await requireAdminAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "ID месячного бонуса обязателен" },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { name, description, minAmount, bonusPercent, isActive } = data;

    // Валидация (только для предоставленных полей)
    if (minAmount !== undefined && minAmount <= 0) {
      return NextResponse.json(
        { error: "Минимальная сумма должна быть больше 0" },
        { status: 400 }
      );
    }

    if (bonusPercent !== undefined && (bonusPercent <= 0 || bonusPercent > 100)) {
      return NextResponse.json(
        { error: "Процент бонуса должен быть от 0.1 до 100" },
        { status: 400 }
      );
    }

    // Проверяем существование
    const existingBonus = await prisma.salary_monthly_bonus.findUnique({
      where: { id }
    });

    if (!existingBonus) {
      return NextResponse.json(
        { error: "Месячный бонус не найден" },
        { status: 404 }
      );
    }

    // Проверяем уникальность minAmount (если он изменяется)
    if (minAmount !== undefined && minAmount !== existingBonus.minAmount) {
      const conflictPlan = await prisma.salary_monthly_bonus.findFirst({
        where: {
          minAmount: parseFloat(minAmount.toString()),
          isActive: true,
          id: { not: id }
        }
      });

      if (conflictPlan) {
        return NextResponse.json(
          { error: `План с суммой $${minAmount.toLocaleString()} уже существует` },
          { status: 400 }
        );
      }
    }

    // Обновляем только предоставленные поля
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.toString();
    if (description !== undefined) updateData.description = description?.toString() || null;
    if (minAmount !== undefined) updateData.minAmount = parseFloat(minAmount.toString());
    if (bonusPercent !== undefined) updateData.bonusPercent = parseFloat(bonusPercent.toString());
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updatedBonus = await prisma.salary_monthly_bonus.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedBonus);
  } catch (error) {
    console.error("Ошибка обновления месячного бонуса:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/salary-monthly-bonus - Удаление месячного бонуса
export async function DELETE(request: NextRequest) {
  const authResult = await requireAdminAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "ID месячного бонуса обязателен" },
        { status: 400 }
      );
    }

    // Проверяем существование
    const existingBonus = await prisma.salary_monthly_bonus.findUnique({
      where: { id }
    });

    if (!existingBonus) {
      return NextResponse.json(
        { error: "Месячный бонус не найден" },
        { status: 404 }
      );
    }

    // Деактивируем вместо удаления
    await prisma.salary_monthly_bonus.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: "Месячный бонус удален" });
  } catch (error) {
    console.error("Ошибка удаления месячного бонуса:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}