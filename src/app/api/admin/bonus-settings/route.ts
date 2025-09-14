import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

// Проверка прав администратора
async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    throw new Error("Не авторизован");
  }

  const decoded = jwt.verify(token, JWT_SECRET) as {
    userId: string;
    role: string;
  };

  if (decoded.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  return decoded.userId;
}

// GET /api/admin/bonus-settings - Получение всех настроек бонусов
export async function GET() {
  try {
    const bonusSettings = await prisma.bonus_settings.findMany({
      orderBy: { createdAt: "desc" },
    });

    const bonusGrids = await prisma.bonus_grid.findMany({
      orderBy: { minAmount: "asc" },
    });

    const bonusMotivations = await prisma.bonus_motivations.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      bonusSettings,
      bonusGrids,
      bonusMotivations,
    });
  } catch (error) {
    console.error("Ошибка получения настроек бонусов:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// POST /api/admin/bonus-settings - Создание новых настроек
export async function POST(request: NextRequest) {
  try {
    await checkAdminAuth();
    const data = await request.json();
    const { type, settings } = data;

    if (type === "bonusGrid") {
      // Создание новой ступени бонусной сетки
      const bonusGrid = await prisma.bonus_grid.create({
        data: {
          shiftType: settings.shiftType || 'MORNING',
          minAmount: settings.minAmount,
          maxAmount: settings.maxAmount,
          bonusPercentage: settings.bonusPercentage,
          fixedBonus: settings.fixedBonus,
          fixedBonusMin: settings.fixedBonusMin,
          description: settings.description,
        },
      });
      return NextResponse.json(bonusGrid, { status: 201 });
    }

    if (type === "bonusMotivation") {
      // Создание новой мотивации
      const bonusMotivation = await prisma.bonus_motivations.create({
        data: {
          type: settings.type, // PERCENTAGE или FIXED_AMOUNT (из enum MotivationType)
          name: settings.name,
          description: settings.description,
          value: settings.value, // процент или фиксированная сумма
          conditions: settings.conditions, // JSON с условиями
          isActive: settings.isActive,
        },
      });
      return NextResponse.json(bonusMotivation, { status: 201 });
    }

    if (type === "baseSettings") {
      // Обновление базовых настроек
      const baseSettings = await prisma.bonus_settings.upsert({
        where: { id: 1 }, // Предполагаем, что у нас есть запись с ID 1
        update: {
          baseCommissionRate: settings.baseCommissionRate,
          baseBonusRate: settings.baseBonusRate,
          isActive: settings.isActive,
        },
        create: {
          baseCommissionRate: settings.baseCommissionRate,
          baseBonusRate: settings.baseBonusRate,
          isActive: settings.isActive,
        },
      });
      return NextResponse.json(baseSettings, { status: 201 });
    }

    return NextResponse.json(
      { error: "Неизвестный тип настроек" },
      { status: 400 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка создания настроек бонусов:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PUT /api/admin/bonus-settings - Обновление настроек
export async function PUT(request: NextRequest) {
  try {
    await checkAdminAuth();
    const data = await request.json();
    const { type, id, updates } = data;

    if (type === "bonusGrid") {
      const updatedGrid = await prisma.bonus_grid.update({
        where: { id },
        data: updates,
      });
      return NextResponse.json(updatedGrid);
    }

    if (type === "bonusMotivation") {
      const updatedMotivation = await prisma.bonus_motivations.update({
        where: { id },
        data: updates,
      });
      return NextResponse.json(updatedMotivation);
    }

    if (type === "baseSettings") {
      const updatedSettings = await prisma.bonus_settings.update({
        where: { id },
        data: updates,
      });
      return NextResponse.json(updatedSettings);
    }

    return NextResponse.json(
      { error: "Неизвестный тип настроек" },
      { status: 400 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка обновления настроек бонусов:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// DELETE /api/admin/bonus-settings - Удаление настроек
export async function DELETE(request: NextRequest) {
  try {
    await checkAdminAuth();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json(
        { error: "Тип и ID обязательны" },
        { status: 400 }
      );
    }

    if (type === "bonusGrid") {
      await prisma.bonus_grid.delete({
        where: { id },
      });
    } else if (type === "bonusMotivation") {
      await prisma.bonus_motivations.delete({
        where: { id },
      });
    } else {
      return NextResponse.json(
        { error: "Неизвестный тип настроек" },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Настройки успешно удалены" });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка удаления настроек бонусов:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
