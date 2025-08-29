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

// POST /api/admin/courses/sections/[sectionId]/pages - Создание новой страницы
export async function POST(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    await checkAdminAuth();

    const body = await request.json();
    const { title, content, blocks, order } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Название страницы обязательно" },
        { status: 400 }
      );
    }

    // Сериализуем блоки в JSON строку, если они переданы
    const serializedBlocks = blocks !== undefined ? JSON.stringify(blocks) : undefined;

    const page = await prisma.course_pages.create({
      data: {
        title,
        content: content || "",
        blocks: serializedBlocks,
        order: order || 0,
        sectionId: params.sectionId,
      },
    });

    // Возвращаем страницу с распарсенными блоками
    const pageWithParsedBlocks = {
      ...page,
      blocks: page.blocks ? JSON.parse(page.blocks) : null
    };

    return NextResponse.json(pageWithParsedBlocks, { status: 201 });
  } catch (error: any) {
    console.error("Ошибка при создании страницы:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось создать страницу" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
