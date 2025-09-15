import { checkAdminAuthUserId } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/finance/categories/[id] - Получение категории по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuthUserId();

    const category = await prisma.finance_categories.findUnique({
      where: { id: params.id }
    });

    if (!category) {
      return NextResponse.json({ error: "Категория не найдена" }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error: any) {
    console.error("Ошибка при получении категории:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить категорию" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PATCH /api/admin/finance/categories/[id] - Обновление категории
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuthUserId();

    const body = await request.json();
    const { name, type, description, color, isArchived } = body;

    // Проверяем, существует ли категория
    const existingCategory = await prisma.finance_categories.findUnique({
      where: { id: params.id }
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Категория не найдена" }, { status: 404 });
    }

    const updatedCategory = await prisma.finance_categories.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(isArchived !== undefined && { isArchived }),
      }
    });

    return NextResponse.json(updatedCategory);
  } catch (error: any) {
    console.error("Ошибка при обновлении категории:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось обновить категорию" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// DELETE /api/admin/finance/categories/[id] - Удаление категории
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuthUserId();

    // Проверяем, существует ли категория
    const existingCategory = await prisma.finance_categories.findUnique({
      where: { id: params.id }
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Категория не найдена" }, { status: 404 });
    }

    // Удаляем категорию
    await prisma.finance_categories.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Категория успешно удалена" });
  } catch (error: any) {
    console.error("Ошибка при удалении категории:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось удалить категорию" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
