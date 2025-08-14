import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/articles - Получение списка статей для админки
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const parentId = searchParams.get("parentId");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const sortBy = searchParams.get("sortBy") || "orderIndex";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: any = {};
    
    // Фильтры
    if (category) where.categoryKey = category;
    if (status) where.status = status;
    if (parentId === 'root') where.parentId = null;
    else if (parentId) where.parentId = parentId;
    
    // Поиск
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ];
    }

    // Сортировка (Prisma ожидает массив условий)
    const orderBy: any[] = [];
    if (sortBy !== 'orderIndex') {
      orderBy.push({ orderIndex: 'asc' } as any);
      orderBy.push({ [sortBy]: sortOrder } as any);
    } else {
      orderBy.push({ orderIndex: sortOrder } as any);
      orderBy.push({ createdAt: 'desc' } as any);
    }

    // Получаем статьи с автором и счетчиками
    const articles = await prisma.article.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
            feedbacks: true,
          },
        },
      },
      orderBy,
      take: limit,
      skip: offset,
    });

    // Общее количество для пагинации
    const total = await prisma.article.count({ where });

    return NextResponse.json({
      articles: articles.map(article => ({
        ...article,
        tags: article.tags ? JSON.parse(article.tags) : [],
      })),
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Ошибка получения статей:", error);
    return NextResponse.json(
      { message: error.message || "Внутренняя ошибка сервера" },
      { status: error.message === "Не авторизован" ? 401 : 500 }
    );
  }
}

// POST /api/admin/articles - Создание новой статьи
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin(request);

    // Надежный парсинг тела запроса (JSON или form-urlencoded), с мягким фолбэком
    const contentType = request.headers.get("content-type")?.toLowerCase() || "";
    let body: any = {};
    if (contentType.includes("application/json")) {
      try {
        body = await request.json();
      } catch {
        // Фолбэк: пробуем как текст → JSON → querystring, но не роняем 400
        const raw = await request.text();
        try { body = raw ? JSON.parse(raw) : {}; }
        catch {
          const params = new URLSearchParams(raw || "");
          params.forEach((v, k) => { body[k] = v; });
        }
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await request.formData();
      form.forEach((v, k) => { body[k] = v; });
    } else {
      // Попытка распарсить как JSON, затем как querystring
      const raw = await request.text();
      try { body = raw ? JSON.parse(raw) : {}; }
      catch {
        const params = new URLSearchParams(raw || "");
        params.forEach((v, k) => { body[k] = v; });
      }
    }

    let { 
      title, 
      content, 
      excerpt, 
      category, 
      categoryKey,
      tags, 
      metaTitle, 
      metaDescription,
      status = "DRAFT",
      type = "PAGE",
      parentId = null
    } = body;

    // Нормализация входящих значений
    category = category || categoryKey || undefined;
    if (typeof type === 'string') type = type.toUpperCase();
    if (typeof status === 'string') status = status.toUpperCase();
    if (typeof parentId === 'string') {
      const p = parentId.trim();
      parentId = (p === '' || p.toLowerCase() === 'null' || p.toLowerCase() === 'undefined') ? null : p;
    }
    if (typeof tags === 'string') {
      try { const parsed = JSON.parse(tags); if (Array.isArray(parsed)) tags = parsed; } catch { /* ignore */ }
    }

    // Валидация/дефолты (контент необязателен, особенно для разделов)
    if (!category) {
      return NextResponse.json(
        { error: "Поле category обязательно" },
        { status: 400 }
      );
    }

    // Если заголовок пуст — присвоим стандартный по типу
    if (!title || String(title).trim() === "") {
      const base = String(type).toUpperCase() === "SECTION" ? "Раздел" : "Страница";
      // Получим существующие названия этого типа для вычисления следующего номера
      const existing = await prisma.article.findMany({
        where: { title: { startsWith: base } },
        select: { title: true },
      });
      let maxNum = 0;
      for (const e of existing) {
        if (e.title === base) { maxNum = Math.max(maxNum, 1); continue; }
        if (e.title.startsWith(base)) {
          const suffix = e.title.slice(base.length).trim();
          const m = /^(\d+)/.exec(suffix);
          if (m) {
            const n = parseInt(m[1], 10);
            if (!Number.isNaN(n)) maxNum = Math.max(maxNum, n);
          }
        }
      }
      title = `${base} ${maxNum + 1}`.trim();
    }

    // Создаем slug из заголовка с поддержкой кириллицы
    const baseSlug = String(title)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\u0400-\u04FFa-z0-9\-]/gi, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');

    // Проверяем уникальность slug и добавляем суффикс при необходимости
    let slug = baseSlug;
    let counter = 1;
    
    while (await prisma.article.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Определим orderIndex в пределах выбранного родителя
    const maxOrder = await prisma.article.aggregate({
      where: { parentId: parentId ?? null },
      _max: { orderIndex: true }
    } as any);
    const nextOrder = (maxOrder._max.orderIndex ?? -1) + 1;

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        content: content ?? "",
        excerpt,
        categoryKey: category,
        tags: tags ? JSON.stringify(tags) : null,
        metaTitle,
        metaDescription,
        authorId: user.id,
        status,
        type,
        parentId,
        orderIndex: nextOrder,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
            feedbacks: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...article,
      tags: article.tags ? JSON.parse(article.tags) : [],
    }, { status: 201 });
  } catch (error: any) {
    console.error("Ошибка создания статьи:", error);
    return NextResponse.json(
      { message: error.message || "Внутренняя ошибка сервера" },
      { status: error.message === "Не авторизован" ? 401 : 500 }
    );
  }
}
