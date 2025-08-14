import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// POST /api/admin/articles/bulk - Массовые операции со статьями
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { action, articleIds } = body;

    // Валидация (для reorder другая форма)
    if (!action) {
      return NextResponse.json(
        { error: "Поле action обязательно" },
        { status: 400 }
      );
    }
    if (action !== "reorder" && (!Array.isArray(articleIds) || articleIds.length === 0)) {
      return NextResponse.json(
        { error: "Список ID статей обязателен" },
        { status: 400 }
      );
    }

    let result;
    const timestamp = new Date();

    // Специальный случай: reorder дерева статей
    if (action === "reorder") {
      if (!Array.isArray(body.items)) {
        return NextResponse.json(
          { error: "Неверный формат: ожидается items: [{id, orderIndex}]" },
          { status: 400 }
        );
      }
      await prisma.$transaction(
        body.items.map((it: any) =>
          prisma.article.update({
            where: { id: String(it.id) },
            data: { orderIndex: Number(it.orderIndex), parentId: it.parentId ?? null },
          })
        )
      );
      return NextResponse.json({ message: "Порядок обновлён" });
    }

    switch (action) {
      case "publish":
        result = await prisma.article.updateMany({
          where: { id: { in: articleIds } },
          data: { 
            status: "PUBLISHED",
            publishedAt: timestamp
          },
        });
        break;

      case "draft":
        result = await prisma.article.updateMany({
          where: { id: { in: articleIds } },
          data: { 
            status: "DRAFT",
            publishedAt: null
          },
        });
        break;

      case "archive":
        result = await prisma.article.updateMany({
          where: { id: { in: articleIds } },
          data: { 
            status: "ARCHIVED",
            publishedAt: null
          },
        });
        break;

      case "delete":
        // Для удаления нужно убедиться, что все статьи существуют
        const existingArticles = await prisma.article.findMany({
          where: { id: { in: articleIds } },
          select: { id: true, title: true }
        });

        if (existingArticles.length !== articleIds.length) {
          return NextResponse.json(
            { error: "Некоторые статьи не найдены" },
            { status: 404 }
          );
        }

        result = await prisma.article.deleteMany({
          where: { id: { in: articleIds } },
        });
        break;

      case "change_category":
        if (!body.category) {
          return NextResponse.json(
            { error: "Категория обязательна для смены категории" },
            { status: 400 }
          );
        }
        result = await prisma.article.updateMany({
          where: { id: { in: articleIds } },
          data: { categoryKey: body.category },
        });
        break;

      case "change_author":
        if (!body.authorId) {
          return NextResponse.json(
            { error: "ID автора обязателен для смены автора" },
            { status: 400 }
          );
        }
        
        // Проверяем существование автора
        const authorExists = await prisma.user.findUnique({
          where: { id: body.authorId }
        });
        
        if (!authorExists) {
          return NextResponse.json(
            { error: "Автор не найден" },
            { status: 404 }
          );
        }

        result = await prisma.article.updateMany({
          where: { id: { in: articleIds } },
          data: { authorId: body.authorId },
        });
        break;

      default:
        return NextResponse.json(
          { error: "Неизвестное действие" },
          { status: 400 }
        );
    }

    // Получаем обновленную информацию о статьях для ответа (кроме удаления)
    let updatedArticles = null;
    if (action !== "delete") {
      updatedArticles = await prisma.article.findMany({
        where: { id: { in: articleIds } },
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
    }

    return NextResponse.json({
      message: `Операция "${action}" выполнена успешно`,
      affected: result.count,
      action,
      articleIds,
      articles: updatedArticles?.map(article => ({
        ...article,
        tags: article.tags ? JSON.parse(article.tags) : [],
      })) || null,
    });
  } catch (error: any) {
    console.error("Ошибка массовой операции:", error);
    return NextResponse.json(
      { message: error.message || "Внутренняя ошибка сервера" },
      { status: error.message === "Не авторизован" ? 401 : 500 }
    );
  }
}
