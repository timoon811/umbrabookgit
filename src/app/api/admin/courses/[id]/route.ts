import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/courses/[id] - Получение курса по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);
    
    const course = await prisma.courses.findUnique({
      where: { id: params.id }
    });
    
    if (!course) {
      return NextResponse.json({ error: "Курс не найден" }, { status: 404 });
    }
    
    return NextResponse.json(course);
  } catch (error: any) {
    console.error("Ошибка при получении курса:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить курс" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PATCH /api/admin/courses/[id] - Обновление курса
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();
    
    const body = await request.json();
    const { title, description, slug, isPublished, category } = body;
    
    // Проверяем существование курса
    const existingCourse = await prisma.courses.findUnique({
      where: { id: params.id }
    });
    
    if (!existingCourse) {
      return NextResponse.json({ error: "Курс не найден" }, { status: 404 });
    }
    
    // Если меняется slug, проверяем уникальность
    if (slug && slug !== existingCourse.slug) {
      const duplicateSlug = await prisma.courses.findUnique({
        where: { slug }
      });
      
      if (duplicateSlug) {
        return NextResponse.json({ error: "Курс с таким slug уже существует" }, { status: 400 });
      }
    }
    
    const updatedCourse = await prisma.courses.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(slug !== undefined && { slug }),
        ...(isPublished !== undefined && { isPublished }),
        ...(category !== undefined && { category }),
      }
    });
    
    return NextResponse.json(updatedCourse);
  } catch (error: any) {
    console.error("Ошибка при обновлении курса:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось обновить курс" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// DELETE /api/admin/courses/[id] - Удаление курса
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();
    
    // Проверяем существование курса
    const existingCourse = await prisma.courses.findUnique({
      where: { id: params.id }
    });
    
    if (!existingCourse) {
      return NextResponse.json({ error: "Курс не найден" }, { status: 404 });
    }
    
    await prisma.courses.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ message: "Курс успешно удален" });
  } catch (error: any) {
    console.error("Ошибка при удалении курса:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось удалить курс" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
