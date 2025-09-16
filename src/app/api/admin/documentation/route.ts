import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";

interface SectionInfo {
  id: string;
  key: string;
  name: string;
  
  description: string | null;
  order: number;
  isVisible: boolean;
  pages: any[];
}

interface ApiResponse {
  sections?: SectionInfo[];
  documentation?: unknown[];
}

// Удалено - используем централизованную авторизацию

// GET /api/admin/documentation - Получение списка разделов и страниц документации
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const section = searchParams.get('section');
    const projectId = searchParams.get('projectId');

    // Принудительно обновляем кэш для получения актуальных данных
    await prisma.$queryRaw`SELECT 1`;
    
    // Получаем разделы с фильтрацией по проекту
    const sectionsWhere: Record<string, unknown> = {
      isVisible: true
    };
    
    if (projectId) {
      sectionsWhere.projectId = projectId;
    }
    
    const sections = await prisma.documentation_sections.findMany({
      where: sectionsWhere,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' }
      ],
      select: {
        id: true,
        key: true,
        name: true,

        description: true,
        order: true,
        isVisible: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Получаем все страницы документации
    const where: Record<string, unknown> = {};
    if (status) {
      where.isPublished = status === 'published';
    }
    if (section) {
      where.sectionId = section;
    }

    const documentation = await prisma.documentation.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' }
      ],
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        content: true,
        sectionId: true,
        order: true,
        isPublished: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Группируем страницы по разделам
    const sectionsWithPages = sections.map(section => ({
      ...section,
      pages: documentation.filter(page => page.sectionId === section.id)
    }));

    const response: ApiResponse = { sections: sectionsWithPages, documentation };
    return NextResponse.json(response);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка при получении документации:", error);
    return NextResponse.json(
      { error: errorMessage || "Не удалось получить документацию" },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// POST /api/admin/documentation - Создание новой страницы документации
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    
    const body = await request.json();
    const { title, description, slug, content, sectionId, order = 0, isPublished = true, parentId } = body;
    
    if (!title) {
      return NextResponse.json({ error: "Название страницы обязательно" }, { status: 400 });
    }
    
    if (!slug) {
      return NextResponse.json({ error: "Slug страницы обязателен" }, { status: 400 });
    }
    
    if (!sectionId) {
      return NextResponse.json({ error: "ID раздела обязателен" }, { status: 400 });
    }
    
    // Проверяем уникальность slug глобально
    const existingPage = await prisma.documentation.findUnique({
      where: { slug }
    });
    
    if (existingPage) {
      return NextResponse.json({ 
        error: `Страница с URL "${slug}" уже существует. Попробуйте создать страницу еще раз.` 
      }, { status: 400 });
    }

    // Дополнительно проверяем уникальность title в том же разделе
    const existingTitle = await prisma.documentation.findFirst({
      where: { 
        title,
        sectionId 
      }
    });
    
    if (existingTitle) {
      return NextResponse.json({ 
        error: `Страница с названием "${title}" уже существует в данном разделе` 
      }, { status: 400 });
    }

    // Проверяем существование раздела
    const section = await prisma.documentation_sections.findUnique({
      where: { id: sectionId }
    });

    if (!section) {
      return NextResponse.json({ error: "Раздел не найден" }, { status: 400 });
    }
    
    // Принудительно обновляем кэш после создания
    const page = await prisma.documentation.create({
      data: {
        title,
        description,
        slug,
        content,
        sectionId,
        order,
        isPublished,
        parentId,
      }
    });
    
    return NextResponse.json(page, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка при создании страницы документации:", error);
    return NextResponse.json(
      { error: errorMessage || "Не удалось создать страницу документации" },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PUT /api/admin/documentation - Переупорядочивание страниц и разделов
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
            prisma.documentation.update({
              where: { id: page.id },
              data: { 
                order: page.order, 
                sectionId: page.sectionId 
              }
            })
          );
          await Promise.all(updatePromises);
        }
      }
      
      // Обновляем порядок самих разделов
      const sectionUpdatePromises = sections.map((section: { id: string; order: number }, index: number) =>
        prisma.documentation_sections.update({
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
        prisma.documentation.update({
          where: { id: page.id },
          data: { 
            order: page.order, 
            sectionId: page.sectionId 
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
    console.error("Ошибка при переупорядочивании:", error);
    return NextResponse.json(
      { error: errorMessage || "Не удалось переупорядочить элементы" },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
