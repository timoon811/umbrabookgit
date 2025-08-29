import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/courses/[slug] - Получение курса по slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const course = await prisma.courses.findUnique({
      where: { 
        slug: params.slug,
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
