import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/bonus-settings - Получение настроек бонусной сетки для пользователей
export async function GET() {
  try {
    // Получаем базовые настройки
    const bonusSettings = await prisma.bonus_settings.findFirst({
      where: { isActive: true },
    });

    // Получаем активную бонусную сетку
    const bonusGrids = await prisma.bonus_grid.findMany({
      where: { isActive: true },
      orderBy: { minAmount: "asc" },
    });

    // Получаем активные мотивации
    const bonusMotivations = await prisma.bonus_motivations.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      bonusSettings: bonusSettings || {
        baseCommissionRate: 30.0,
        baseBonusRate: 5.0,
      },
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
