import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

// Проверка прав администратора
async function checkAdminAuth(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    throw new Error("Не авторизован");
  }

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

// GET /api/admin/managers/[id]/settings - Получение настроек менеджера
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdminAuth(request);
    const { id: processorId } = await params;

    // Получаем настройки менеджера (пока используем значения по умолчанию)
    // В будущем можно создать отдельную таблицу для персональных настроек
    const settings = {
      baseRate: 5.0,
      bonusPercentage: 0,
      fixedBonus: 0,
      customBonusRules: "",
    };

    return NextResponse.json(settings);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка получения настроек менеджера:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PUT /api/admin/managers/[id]/settings - Обновление настроек менеджера
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdminAuth(request);
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
