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

// GET /api/admin/courses/pages/[id] - Получение страницы курса
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();

    const page = await prisma.course_pages.findUnique({
      where: { id: params.id },
      include: {
        section: {
          include: {
            course: true
          }
        }
      }
    });

    if (!page) {
      return NextResponse.json(
        { error: "Страница не найдена" },
        { status: 404 }
      );
    }

    // Парсим поле blocks из JSON строки обратно в объект
    const pageWithParsedBlocks = {
      ...page,
      blocks: page.blocks ? JSON.parse(page.blocks) : null
    };

    return NextResponse.json(pageWithParsedBlocks);
  } catch (error: any) {
    console.error("Ошибка при получении страницы курса:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить страницу курса" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PATCH /api/admin/courses/pages/[id] - Обновление страницы курса
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();

    const body = await request.json();
    const { title, content, blocks, order, isPublished } = body;

    // Сериализуем блоки в JSON строку, если они переданы
    const serializedBlocks = blocks !== undefined ? JSON.stringify(blocks) : undefined;

    const page = await prisma.course_pages.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(serializedBlocks !== undefined && { blocks: serializedBlocks }),
        ...(order !== undefined && { order }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    // Возвращаем страницу с распарсенными блоками
    const pageWithParsedBlocks = {
      ...page,
      blocks: page.blocks ? JSON.parse(page.blocks) : null
    };

    return NextResponse.json(pageWithParsedBlocks);
  } catch (error: any) {
    console.error("Ошибка при обновлении страницы курса:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось обновить страницу курса" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// DELETE /api/admin/courses/pages/[id] - Удаление страницы курса
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();
    
    await prisma.course_pages.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ message: "Страница успешно удалена" });
  } catch (error: any) {
    console.error("Ошибка при удалении страницы курса:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось удалить страницу курса" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
