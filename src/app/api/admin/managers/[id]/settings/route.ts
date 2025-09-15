import { checkAdminAuthUserId } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Проверка прав администратора


// PUT /api/admin/managers/[id]/settings - Обновление настроек менеджера
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdminAuthUserId();
    const { id: processorId } = await params;
    const data = await request.json();

    // Здесь можно сохранить настройки в базу данных
    // Пока возвращаем обновленные настройки
    const updatedSettings = {
      baseRate: data.baseRate || 5.0,
      bonusPercentage: data.bonusPercentage || 0,
      fixedBonus: data.fixedBonus || 0,
      customBonusRules: data.customBonusRules || "",
    };

    return NextResponse.json(updatedSettings);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка обновления настроек менеджера:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
