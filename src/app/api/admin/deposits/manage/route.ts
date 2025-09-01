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

// PUT /api/admin/deposits/manage - Редактирование депозита
export async function PUT(request: NextRequest) {
  try {
    await checkAdminAuth(request);
    const data = await request.json();
    const { depositId, updates } = data;

    if (!depositId) {
      return NextResponse.json(
        { error: "ID депозита обязателен" },
        { status: 400 }
      );
    }

    // Проверяем существование депозита
    const existingDeposit = await prisma.processor_deposits.findUnique({
      where: { id: depositId },
    });

    if (!existingDeposit) {
      return NextResponse.json(
        { error: "Депозит не найден" },
        { status: 404 }
      );
    }

    // Обновляем депозит
    const updatedDeposit = await prisma.processor_deposits.update({
      where: { id: depositId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedDeposit);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка редактирования депозита:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// DELETE /api/admin/deposits/manage - Удаление депозита
export async function DELETE(request: NextRequest) {
  try {
    await checkAdminAuth(request);
    const { searchParams } = new URL(request.url);
    const depositId = searchParams.get("depositId");

    if (!depositId) {
      return NextResponse.json(
        { error: "ID депозита обязателен" },
        { status: 400 }
      );
    }

    // Проверяем существование депозита
    const existingDeposit = await prisma.processor_deposits.findUnique({
      where: { id: depositId },
    });

    if (!existingDeposit) {
      return NextResponse.json(
        { error: "Депозит не найден" },
        { status: 404 }
      );
    }

    // Удаляем депозит
    await prisma.processor_deposits.delete({
      where: { id: depositId },
    });

    return NextResponse.json({ message: "Депозит успешно удален" });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка удаления депозита:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PATCH /api/admin/deposits/manage - Смена обработчика
export async function PATCH(request: NextRequest) {
  try {
    await checkAdminAuth(request);
    const data = await request.json();
    const { depositId, newProcessorId } = data;

    if (!depositId || !newProcessorId) {
      return NextResponse.json(
        { error: "ID депозита и нового обработчика обязательны" },
        { status: 400 }
      );
    }

    // Проверяем существование депозита
    const existingDeposit = await prisma.processor_deposits.findUnique({
      where: { id: depositId },
    });

    if (!existingDeposit) {
      return NextResponse.json(
        { error: "Депозит не найден" },
        { status: 404 }
      );
    }

    // Проверяем существование нового обработчика
    const newProcessor = await prisma.users.findUnique({
      where: { id: newProcessorId },
    });

    if (!newProcessor || newProcessor.role !== "PROCESSOR") {
      return NextResponse.json(
        { error: "Новый обработчик не найден или не имеет роли PROCESSOR" },
        { status: 400 }
      );
    }

    // Обновляем обработчика депозита
    const updatedDeposit = await prisma.processor_deposits.update({
      where: { id: depositId },
      data: {
        processorId: newProcessorId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedDeposit);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка смены обработчика:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
