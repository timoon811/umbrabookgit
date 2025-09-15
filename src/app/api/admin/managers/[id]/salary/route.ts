import { checkAdminAuthUserId } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Проверка прав администратора


// PUT /api/admin/managers/[id]/salary - Обновление данных о зарплате менеджера
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdminAuthUserId();
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
