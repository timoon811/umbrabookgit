import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// GET /api/documentation/[slug] - Получение страницы документации по slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Проверяем авторизацию - документация требует авторизации
  const authResult = await requireAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const page = await prisma.documentation.findFirst({
      where: {
        slug: params.slug,
        isPublished: true
      }
    });
    
    if (!page) {
      return NextResponse.json({ error: "Страница не найдена" }, { status: 404 });
    }
    
    return NextResponse.json({ page });
  } catch (error) {
    console.error("Ошибка при получении страницы документации:", error);
    return NextResponse.json(
      { error: "Не удалось получить страницу документации" },
      { status: 500 }
    );
  }
}
