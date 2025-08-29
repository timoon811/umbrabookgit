import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

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

// GET /api/admin/finance/projects/[id] - Получение проекта по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();

    const project = await prisma.finance_projects.findUnique({
      where: { id: params.id }
    });

    if (!project) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error("Ошибка при получении проекта:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить проект" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PATCH /api/admin/finance/projects/[id] - Обновление проекта
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();

    const body = await request.json();
    const { name, description, status, isArchived } = body;

    // Проверяем, существует ли проект
    const existingProject = await prisma.finance_projects.findUnique({
      where: { id: params.id }
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
    }

    const updatedProject = await prisma.finance_projects.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(isArchived !== undefined && { isArchived }),
      }
    });

    return NextResponse.json(updatedProject);
  } catch (error: any) {
    console.error("Ошибка при обновлении проекта:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось обновить проект" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// DELETE /api/admin/finance/projects/[id] - Удаление проекта
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();

    // Проверяем, существует ли проект
    const existingProject = await prisma.finance_projects.findUnique({
      where: { id: params.id }
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
    }

    // Удаляем проект
    await prisma.finance_projects.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Проект успешно удален" });
  } catch (error: any) {
    console.error("Ошибка при удалении проекта:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось удалить проект" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
