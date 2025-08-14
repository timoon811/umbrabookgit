import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FeedbackType } from "@prisma/client";

// POST /api/feedback - Создание обратной связи
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleId, type, rating, message, userId } = body;

    // Валидация
    if (!articleId || !type) {
      return NextResponse.json(
        { error: "Поля articleId и type обязательны" },
        { status: 400 }
      );
    }

    // Проверяем, существует ли статья
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Статья не найдена" },
        { status: 404 }
      );
    }

    // Получаем метаданные из заголовков
    const userAgent = request.headers.get("user-agent");
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip");

    const feedback = await prisma.feedback.create({
      data: {
        articleId,
        type: type as FeedbackType,
        rating,
        message,
        userId,
        userAgent,
        ipAddress,
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error("Error creating feedback:", error);
    return NextResponse.json(
      { error: "Не удалось сохранить обратную связь" },
      { status: 500 }
    );
  }
}

// GET /api/feedback - Получение статистики обратной связи
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");

    const where: any = {};
    if (articleId) where.articleId = articleId;

    // Общая статистика
    const stats = await prisma.feedback.groupBy({
      by: ["type"],
      where,
      _count: {
        type: true,
      },
    });

    // Средний рейтинг
    const avgRating = await prisma.feedback.aggregate({
      where: {
        ...where,
        type: FeedbackType.RATING,
        rating: { not: null },
      },
      _avg: {
        rating: true,
      },
    });

    // Последние отзывы (если запрашивается по конкретной статье)
    let recentFeedback = null;
    if (articleId) {
      recentFeedback = await prisma.feedback.findMany({
        where: {
          articleId,
          message: { not: null },
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
    }

    return NextResponse.json({
      stats: stats.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>),
      averageRating: avgRating._avg.rating,
      recentFeedback,
    });
  } catch (error) {
    console.error("Error fetching feedback stats:", error);
    return NextResponse.json(
      { error: "Не удалось получить статистику" },
      { status: 500 }
    );
  }
}

