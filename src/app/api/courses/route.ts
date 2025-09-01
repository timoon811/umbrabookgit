import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  // Проверяем авторизацию
  const authResult = await requireAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const courses = await prisma.courses.findMany({
      where: {
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        category: true,
        createdAt: true,
        updatedAt: true,
        sections: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
            title: true,
            pages: {
              where: {
                isPublished: true,
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Обогащаем данные курсов
    const enrichedCourses = courses.map(course => {
      const totalSections = course.sections.length;
      const totalPages = course.sections.reduce((sum, section) => sum + section.pages.length, 0);

      return {
        ...course,
        totalSections,
        totalPages,
        // Оценка на основе сложности (можно будет добавить в админку)
        difficulty: course.category === 'beginner' ? 'Начинающий' :
                   course.category === 'intermediate' ? 'Средний' : 'Продвинутый',
        // Примерная продолжительность (можно будет добавить в админку)
        estimatedDuration: `${Math.max(2, Math.floor(totalPages * 0.5))} часов`,
        // Рейтинг (можно будет добавить систему рейтингов)
        rating: 4.5 + Math.random() * 0.5, // Временное значение
      };
    });

    // Статистика
    const totalCourses = enrichedCourses.length;
    const beginnerCourses = enrichedCourses.filter(c => c.difficulty === 'Начинающий').length;
    const intermediateCourses = enrichedCourses.filter(c => c.difficulty === 'Средний').length;
    const advancedCourses = enrichedCourses.filter(c => c.difficulty === 'Продвинутый').length;

    return NextResponse.json({
      courses: enrichedCourses,
      statistics: {
        total: totalCourses,
        beginner: beginnerCourses,
        intermediate: intermediateCourses,
        advanced: advancedCourses,
      },
    });
  } catch (error: unknown) {
    console.error("Ошибка получения курсов:", error);
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}