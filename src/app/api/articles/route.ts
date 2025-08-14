import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ArticleStatus } from "@prisma/client";

// GET /api/articles - Получение списка статей
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status") as ArticleStatus;
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search");

    const where: any = {};
    
    // Фильтры
    if (category) where.categoryKey = category;
    if (status) where.status = status;
    else where.status = ArticleStatus.PUBLISHED; // По умолчанию только опубликованные
    
    // Поиск
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ];
    }

    // Получаем статьи с автором и категорией
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
        category: {
          select: {
            key: true,
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
            feedbacks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
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
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Не удалось получить статьи" },
      { status: 500 }
    );
  }
}

// POST /api/articles - Создание новой статьи
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, excerpt, category, tags, authorId, metaTitle, metaDescription } = body;

    // Валидация
    if (!title || !content || !category || !authorId) {
      return NextResponse.json(
        { error: "Поля title, content, category и authorId обязательны" },
        { status: 400 }
      );
    }

    // Создаем slug из заголовка
    const slug = title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    // Проверяем уникальность slug
    const existingArticle = await prisma.article.findUnique({
      where: { slug },
    });

    if (existingArticle) {
      return NextResponse.json(
        { error: "Статья с таким заголовком уже существует" },
        { status: 409 }
      );
    }

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        categoryKey: category,
        tags: tags ? JSON.stringify(tags) : null,
        metaTitle,
        metaDescription,
        authorId,
        status: ArticleStatus.DRAFT,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...article,
      tags: article.tags ? JSON.parse(article.tags) : [],
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json(
      { error: "Не удалось создать статью" },
      { status: 500 }
    );
  }
}

