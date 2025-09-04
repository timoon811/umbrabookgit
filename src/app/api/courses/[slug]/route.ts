import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// GET /api/courses/[slug] - Получение курса по slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Проверяем авторизацию - курсы требуют авторизации
  const authResult = await requireAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { slug } = await params;
    const course = await prisma.courses.findUnique({
      where: { 
        slug: slug,
        isPublished: true // Только опубликованные курсы
      },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        category: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    if (!course) {
      return NextResponse.json({ error: "Курс не найден" }, { status: 404 });
    }
    
    return NextResponse.json(course);
  } catch (error) {
    console.error("Ошибка при получении курса:", error);
    return NextResponse.json(
      { error: "Не удалось получить курс" },
      { status: 500 }
    );
  }
}
