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

// GET /api/admin/courses - Получение списка курсов
export async function GET(request: NextRequest) {
  try {
    await checkAdminAuth();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    
    const where: any = {};
    
    if (status) {
      where.isPublished = status === 'published';
    }
    
    if (category) {
      where.category = category;
    }
    
    const courses = await prisma.courses.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    return NextResponse.json({ courses });
  } catch (error: any) {
    console.error("Ошибка при получении курсов:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить курсы" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// POST /api/admin/courses - Создание нового курса
export async function POST(request: NextRequest) {
  try {
    await checkAdminAuth();
    
    const body = await request.json();
    const { title, description, slug, isPublished = false, category = 'general' } = body;
    
    if (!title) {
      return NextResponse.json({ error: "Название курса обязательно" }, { status: 400 });
    }
    
    if (!slug) {
      return NextResponse.json({ error: "Slug курса обязателен" }, { status: 400 });
    }
    
    // Проверяем уникальность slug
    const existingCourse = await prisma.courses.findUnique({
      where: { slug }
    });
    
    if (existingCourse) {
      return NextResponse.json({ error: "Курс с таким slug уже существует" }, { status: 400 });
    }
    
    const course = await prisma.courses.create({
      data: {
        title,
        description,
        slug,
        isPublished,
        category,
      }
    });
    
    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    console.error("Ошибка при создании курса:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось создать курс" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PUT /api/admin/courses - Переупорядочивание страниц и разделов курсов
export async function PUT(request: NextRequest) {
  try {
    await checkAdminAuth();

    const body = await request.json();
    const { type, sections, pages, sectionId } = body;

    if (!type) {
      return NextResponse.json({ error: "Неверный формат данных" }, { status: 400 });
    }

    if (type === 'sections') {
      if (!Array.isArray(sections)) {
        return NextResponse.json({ error: "Неверный формат данных для разделов" }, { status: 400 });
      }
      // Переупорядочивание страниц внутри разделов
      for (const section of sections) {
        if (section.pages && Array.isArray(section.pages)) {
          const updatePromises = section.pages.map((page: { id: string; order: number; sectionId: string }) =>
            prisma.courses.update({
              where: { id: page.id },
              data: { 
                order: page.order, 
                category: page.sectionId // В курсах используется category как sectionId
              }
            })
          );
          await Promise.all(updatePromises);
        }
      }
      
      // Обновляем порядок самих разделов курсов
      const sectionUpdatePromises = sections.map((section: { id: string; order: number }, index: number) =>
        prisma.course_sections.update({
          where: { id: section.id },
          data: { order: index }
        })
      );
      await Promise.all(sectionUpdatePromises);
      
      // Принудительно обновляем кэш после изменения порядка
      await prisma.$queryRaw`SELECT 1`;
    } else if (type === 'pages') {
      if (!Array.isArray(pages) || !sectionId) {
        return NextResponse.json({ error: "Неверный формат данных для страниц" }, { status: 400 });
      }
      
      // Обновляем порядок страниц в указанном разделе
      const updatePromises = pages.map((page: { id: string; order: number; sectionId: string }) =>
        prisma.courses.update({
          where: { id: page.id },
          data: { 
            order: page.order,
            category: page.sectionId // В курсах используется category как sectionId
          }
        })
      );
      await Promise.all(updatePromises);
      
      // Принудительно обновляем кэш после изменения порядка
      await prisma.$queryRaw`SELECT 1`;
    } else {
      return NextResponse.json({ error: "Неизвестный тип переупорядочивания" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка при переупорядочивании курсов:", error);
    return NextResponse.json(
      { error: errorMessage || "Не удалось переупорядочить элементы" },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
