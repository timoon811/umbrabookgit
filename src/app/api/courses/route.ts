import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

// Проверка авторизации
async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Не авторизован" },
      { status: 401 }
    );
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };

    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден или заблокирован" },
        { status: 403 }
      );
    }

    return user;
  } catch (error) {
    console.error("Ошибка проверки токена:", error);
    return NextResponse.json(
      { error: "Недействительный токен" },
      { status: 401 }
    );
  }
}

export async function GET(request: NextRequest) {
  const authResult = await checkAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
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
  } catch (error: any) {
    console.error("Ошибка получения курсов:", error);
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}