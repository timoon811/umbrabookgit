import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/articles/[id] - Получение статьи для редактирования
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const article = await prisma.article.findUnique({
      where: { id },
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

    if (!article) {
      return NextResponse.json(
        { error: "Статья не найдена" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...article,
      tags: article.tags ? JSON.parse(article.tags) : [],
    });
  } catch (error: any) {
    console.error("Ошибка получения статьи:", error);
    return NextResponse.json(
      { message: error.message || "Внутренняя ошибка сервера" },
      { status: error.message === "Не авторизован" ? 401 : 500 }
    );
  }
}

// PUT /api/admin/articles/[id] - Полное обновление статьи
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const body = await request.json();
    const { 
      title, 
      content, 
      excerpt, 
      category, 
      tags, 
      metaTitle, 
      metaDescription,
      status,
      orderIndex
    } = body;

    // Валидация
    if (!title || !content || !category) {
      return NextResponse.json(
        { error: "Поля title, content и category обязательны" },
        { status: 400 }
      );
    }

    // Проверяем существование статьи
    const existingArticle = await prisma.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { error: "Статья не найдена" },
        { status: 404 }
      );
    }

    // Создаем новый slug если изменился заголовок
    let newSlug = existingArticle.slug;
    if (title !== existingArticle.title) {
      const baseSlug = title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\u0400-\u04FFa-z0-9\-]/gi, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');

      // Проверяем уникальность нового slug (исключая текущую статью)
      newSlug = baseSlug;
      let counter = 1;
      
      while (true) {
        const slugExists = await prisma.article.findFirst({
          where: { 
            slug: newSlug,
            id: { not: id }
          }
        });
        
        if (!slugExists) break;
        
        newSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Определяем publishedAt
    let publishedAt = existingArticle.publishedAt;
    if (status === "PUBLISHED" && existingArticle.status !== "PUBLISHED") {
      publishedAt = new Date();
    } else if (status !== "PUBLISHED") {
      publishedAt = null;
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        title,
        slug: newSlug,
        content,
        excerpt,
        categoryKey: category,
        tags: tags ? JSON.stringify(tags) : null,
        metaTitle,
        metaDescription,
        status,
        publishedAt,
        ...(orderIndex !== undefined ? { orderIndex: Number(orderIndex) } : {}),
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
    });
  } catch (error: any) {
    console.error("Ошибка обновления статьи:", error);
    return NextResponse.json(
      { message: error.message || "Внутренняя ошибка сервера" },
      { status: error.message === "Не авторизован" ? 401 : 500 }
    );
  }
}

// PATCH /api/admin/articles/[id] - Частичное обновление статьи (например, только статус)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const body = await request.json();

    // Проверяем существование статьи
    const existingArticle = await prisma.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { error: "Статья не найдена" },
        { status: 404 }
      );
    }

    // Определяем publishedAt при изменении статуса
    let publishedAt = existingArticle.publishedAt;
    if (body.status === "PUBLISHED" && existingArticle.status !== "PUBLISHED") {
      publishedAt = new Date();
    } else if (body.status && body.status !== "PUBLISHED") {
      publishedAt = null;
    }

    const updateData: any = { ...body };

    // Если меняется title — регенерируем уникальный slug
    if (typeof body.title === 'string' && body.title.trim() && body.title !== existingArticle.title) {
      const baseSlug = body.title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\u0400-\u04FFa-z0-9\-]/gi, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');

      let newSlug = baseSlug;
      let counter = 1;
      while (true) {
        const exists = await prisma.article.findFirst({
          where: {
            slug: newSlug,
            id: { not: existingArticle.id },
          },
        });
        if (!exists) break;
        newSlug = `${baseSlug}-${counter++}`;
      }
      updateData.slug = newSlug;
    }

    // Если меняется родитель — переносим в конец нового блока
    if (body.hasOwnProperty('parentId') && body.parentId !== existingArticle.parentId) {
      const agg = await prisma.article.aggregate({
        where: { parentId: body.parentId ?? null },
        _max: { orderIndex: true },
      });
      updateData.orderIndex = (agg._max.orderIndex ?? -1) + 1;
    }
    if (publishedAt !== existingArticle.publishedAt) {
      updateData.publishedAt = publishedAt;
    }

    // Обрабатываем tags если они переданы
    if (updateData.tags) {
      updateData.tags = JSON.stringify(updateData.tags);
    }

    const article = await prisma.article.update({
      where: { id },
      data: updateData,
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
    });
  } catch (error: any) {
    console.error("Ошибка частичного обновления статьи:", error);
    return NextResponse.json(
      { message: error.message || "Внутренняя ошибка сервера" },
      { status: error.message === "Не авторизован" ? 401 : 500 }
    );
  }
}

// DELETE /api/admin/articles/[id] - Удаление статьи
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    // Проверяем существование статьи
    const existingArticle = await prisma.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { error: "Статья не найдена" },
        { status: 404 }
      );
    }

    // Удаляем статью (каскадное удаление комментариев и отзывов настроено в схеме)
    await prisma.article.delete({
      where: { id },
    });

    return NextResponse.json({ 
      message: "Статья успешно удалена",
      deletedId: id
    });
  } catch (error: any) {
    console.error("Ошибка удаления статьи:", error);
    return NextResponse.json(
      { message: error.message || "Внутренняя ошибка сервера" },
      { status: error.message === "Не авторизован" ? 401 : 500 }
    );
  }
}
