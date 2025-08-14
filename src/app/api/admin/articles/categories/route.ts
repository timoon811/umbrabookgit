import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/articles/categories - Получение всех категорий с статистикой
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    // Получаем все категории с количеством статей
    const categories = await prisma.category.findMany({
      where: { isWorkspace: true },
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: { order: "asc" },
    });

    // Преобразуем в нужный формат
    const result = categories.map(category => ({
      id: category.id,
      key: category.key,
      name: category.name,
      description: category.description,
      order: category.order,
      isActive: category.isActive,
      articlesCount: category._count.articles,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Ошибка получения категорий:", error);
    return NextResponse.json(
      { message: error.message || "Внутренняя ошибка сервера" },
      { status: error.message === "Не авторизован" ? 401 : 500 }
    );
  }
}

// PUT /api/admin/articles/categories - Обновление всех категорий
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { categories } = body;

    if (!Array.isArray(categories)) {
      return NextResponse.json(
        { error: "Некорректный формат данных" },
        { status: 400 }
      );
    }

    // Обновляем каждую категорию
    for (const category of categories) {
      if (category.id) {
        await prisma.category.update({
          where: { id: category.id },
          data: {
            name: category.name,
            description: category.description,
            order: category.order,
            isActive: category.isActive,
          },
        });
      }
    }
    
    return NextResponse.json({
      message: "Настройки категорий сохранены",
      categories,
    });
  } catch (error: any) {
    console.error("Ошибка сохранения настроек категорий:", error);
    return NextResponse.json(
      { message: error.message || "Внутренняя ошибка сервера" },
      { status: error.message === "Не авторизован" ? 401 : 500 }
    );
  }
}

// POST /api/admin/articles/categories - Создание новой категории
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    let { key, name, description, order } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Название воркспейса обязательно" },
        { status: 400 }
      );
    }

    // Автогенерация ключа (slug) из названия, если не передан
    if (!key || typeof key !== 'string') {
      const base = String(name)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/gi, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
      key = base || `workspace-${Date.now()}`;
      // Гарантия уникальности
      let uniq = key; let i = 1;
      while (await prisma.category.findUnique({ where: { key: uniq } })) {
        uniq = `${key}-${i++}`;
      }
      key = uniq;
    }

    // Проверяем уникальность ключа
    const existingCategory = await prisma.category.findUnique({
      where: { key }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Категория с таким ключом уже существует" },
        { status: 409 }
      );
    }

    // Создаем категорию
    const category = await prisma.category.create({
      data: {
        key,
        name,
        description,
        order: order || 0,
        isWorkspace: true,
      },
    });
    
    return NextResponse.json({
      message: "Категория создана",
      category,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Ошибка создания категории:", error);
    return NextResponse.json(
      { message: error.message || "Внутренняя ошибка сервера" },
      { status: error.message === "Не авторизован" ? 401 : 500 }
    );
  }
}
