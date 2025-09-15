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

  const decoded = jwt.verify(token, JWT_SECRET) as {
    userId: string;
    role: string;
  };

  if (decoded.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  return decoded.userId;
}

// GET /api/admin/managers/[id]/salary - Получение данных о зарплате менеджера
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdminAuth(request);
    const { id: processorId } = await params;

    // Получаем данные о зарплате (пока используем значения по умолчанию)
    // В будущем можно создать отдельную таблицу для зарплатных данных
    const salary = {
      baseSalary: 0,
      commissionRate: 0,
      bonusMultiplier: 1.0,
      lastPaid: null,
      totalPaid: 0,
    };

    return NextResponse.json(salary);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка получения данных о зарплате:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PUT /api/admin/managers/[id]/salary - Обновление данных о зарплате менеджера
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdminAuth(request);
    const { id: processorId } = await params;
    const data = await request.json();

    // Здесь можно сохранить данные о зарплате в базу данных
    // Пока возвращаем обновленные данные
    const updatedSalary = {
      baseSalary: data.baseSalary || 0,
      commissionRate: data.commissionRate || 0,
      bonusMultiplier: data.bonusMultiplier || 1.0,
      lastPaid: data.lastPaid || null,
      totalPaid: data.totalPaid || 0,
    };

    return NextResponse.json(updatedSalary);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка обновления данных о зарплате:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
