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
      // Валидация данных бонусной сетки
      if (typeof settings.minAmount !== 'number' || settings.minAmount < 0) {
        return NextResponse.json(
          { error: "Минимальная сумма должна быть положительным числом" },
          { status: 400 }
        );
      }

      if (settings.maxAmount !== null && settings.maxAmount !== undefined) {
        if (typeof settings.maxAmount !== 'number' || settings.maxAmount < 0) {
          return NextResponse.json(
            { error: "Максимальная сумма должна быть положительным числом" },
            { status: 400 }
          );
        }
        
        if (settings.maxAmount <= settings.minAmount) {
          return NextResponse.json(
            { error: "Максимальная сумма должна быть больше минимальной" },
            { status: 400 }
          );
        }
      }

      if (typeof settings.bonusPercentage !== 'number' || settings.bonusPercentage < 0) {
        return NextResponse.json(
          { error: "Процент бонуса должен быть положительным числом" },
          { status: 400 }
        );
      }

      if (settings.bonusPercentage > 100) {
        return NextResponse.json(
          { error: "Процент бонуса не может превышать 100%" },
          { status: 400 }
        );
      }

      // Создание новой ступени единой бонусной сетки
      const bonusGrid = await prisma.bonus_grid.create({
        data: {
          shiftType: 'MORNING', // Единая сетка использует MORNING как стандартный тип
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
          isActive: settings.isActive,
        },
        create: {
          baseCommissionRate: settings.baseCommissionRate,
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
      // Валидация обновлений бонусной сетки
      if (updates.minAmount !== undefined) {
        if (typeof updates.minAmount !== 'number' || updates.minAmount < 0) {
          return NextResponse.json(
            { error: "Минимальная сумма должна быть положительным числом" },
            { status: 400 }
          );
        }
      }

      if (updates.maxAmount !== undefined && updates.maxAmount !== null) {
        if (typeof updates.maxAmount !== 'number' || updates.maxAmount < 0) {
          return NextResponse.json(
            { error: "Максимальная сумма должна быть положительным числом" },
            { status: 400 }
          );
        }
      }

      if (updates.bonusPercentage !== undefined) {
        if (typeof updates.bonusPercentage !== 'number' || updates.bonusPercentage < 0) {
          return NextResponse.json(
            { error: "Процент бонуса должен быть положительным числом" },
            { status: 400 }
          );
        }
        
        if (updates.bonusPercentage > 100) {
          return NextResponse.json(
            { error: "Процент бонуса не может превышать 100%" },
            { status: 400 }
          );
        }
      }

      // Проверяем соотношение min/max если обновляется одно из них
      if (updates.minAmount !== undefined || updates.maxAmount !== undefined) {
        const currentRecord = await prisma.bonus_grid.findUnique({ where: { id } });
        if (!currentRecord) {
          return NextResponse.json(
            { error: "Запись не найдена" },
            { status: 404 }
          );
        }

        const newMinAmount = updates.minAmount !== undefined ? updates.minAmount : currentRecord.minAmount;
        const newMaxAmount = updates.maxAmount !== undefined ? updates.maxAmount : currentRecord.maxAmount;

        if (newMaxAmount !== null && newMaxAmount <= newMinAmount) {
          return NextResponse.json(
            { error: "Максимальная сумма должна быть больше минимальной" },
            { status: 400 }
          );
        }
      }

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
