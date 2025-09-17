import { checkAdminAuthUserId } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from '@/lib/api-auth';

// GET /api/admin/finance/projects/[id] - Получение проекта по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();

    const project = await prisma.finance_projects.findUnique({
      where: { id: (await params).id }
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();

    const body = await request.json();
    const { name, description, status, isArchived } = body;

    // Проверяем, существует ли проект
    const existingProject = await prisma.finance_projects.findUnique({
      where: { id: (await params).id }
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
    }

    const updatedProject = await prisma.finance_projects.update({
      where: { id: (await params).id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();

    // Проверяем, существует ли проект
    const existingProject = await prisma.finance_projects.findUnique({
      where: { id: (await params).id }
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
    }

    // Удаляем проект
    await prisma.finance_projects.delete({
      where: { id: (await params).id }
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
