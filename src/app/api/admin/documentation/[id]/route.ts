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

// GET /api/admin/documentation/[id] - Получение страницы документации по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();
    
    const page = await prisma.documentation.findUnique({
      where: { id: params.id }
    });
    
    if (!page) {
      return NextResponse.json({ error: "Страница не найдена" }, { status: 404 });
    }
    
    return NextResponse.json({ page });
  } catch (error: any) {
    console.error("Ошибка при получении страницы документации:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить страницу документации" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PATCH /api/admin/documentation/[id] - Обновление страницы документации
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdminAuth();
    
    const { id } = await params;
    
    // Обработка разных типов контента (включая sendBeacon и FormData)
    let body;
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      body = await request.json();
    } else if (contentType?.includes('multipart/form-data') || contentType?.includes('application/x-www-form-urlencoded')) {
      // Для sendBeacon с FormData
      const formData = await request.formData();
      body = {
        content: formData.get('content')?.toString(),
        title: formData.get('title')?.toString(),
        description: formData.get('description')?.toString()
      };
    } else {
      // Для sendBeacon (text/plain) или других форматов
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = { content: text };
      }
    }
    
    const { title, description, slug, content, sectionId, order, isPublished, parentId } = body;
    
    // Проверяем, существует ли страница
    const existingPage = await prisma.documentation.findUnique({
      where: { id }
    });
    
    if (!existingPage) {
      return NextResponse.json({ error: "Страница не найдена" }, { status: 404 });
    }
    
    // Если изменяется slug, проверяем уникальность
    if (slug && slug !== existingPage.slug) {
      const duplicateSlug = await prisma.documentation.findUnique({
        where: { slug }
      });
      
      if (duplicateSlug) {
        return NextResponse.json({ error: "Страница с таким slug уже существует" }, { status: 400 });
      }
    }

    // Если изменяется sectionId, проверяем существование раздела
    if (sectionId && sectionId !== existingPage.sectionId) {
      const section = await prisma.documentation_sections.findUnique({
        where: { id: sectionId }
      });
      
      if (!section) {
        return NextResponse.json({ error: "Раздел не найден" }, { status: 400 });
      }
    }
    
    const updatedPage = await prisma.documentation.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(slug !== undefined && { slug }),
        ...(content !== undefined && { content }),
        ...(sectionId !== undefined && { sectionId }),
        ...(order !== undefined && { order }),
        ...(isPublished !== undefined && { isPublished }),
        ...(parentId !== undefined && { parentId }),
      }
    });
    
    // Принудительно обновляем кэш после изменения
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json(updatedPage);
  } catch (error: any) {
    console.error("Ошибка при обновлении страницы документации:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось обновить страницу документации" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// DELETE /api/admin/documentation/[id] - Удаление страницы документации
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdminAuth();
    
    const { id } = await params;
    // Проверяем, существует ли страница
    const existingPage = await prisma.documentation.findUnique({
      where: { id }
    });
    
    if (!existingPage) {
      return NextResponse.json({ error: "Страница не найдена" }, { status: 404 });
    }
    
    // Удаляем страницу
    await prisma.documentation.delete({
      where: { id }
    });
    
    // Принудительно обновляем кэш после удаления
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({ message: "Страница успешно удалена" });
  } catch (error: any) {
    console.error("Ошибка при удалении страницы документации:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось удалить страницу документации" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
