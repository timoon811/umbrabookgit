import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ArticleStatus } from "@prisma/client";

// GET /api/articles/[slug] - Получение статьи по slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          where: { status: "APPROVED" },
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
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

    // Увеличиваем счетчик просмотров
    await prisma.article.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({
      ...article,
      tags: article.tags ? JSON.parse(article.tags) : [],
      viewCount: article.viewCount + 1,
    });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { error: "Не удалось получить статью" },
      { status: 500 }
    );
  }
}

// PUT /api/articles/[slug] - Обновление статьи
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { title, content, excerpt, category, tags, status, metaTitle, metaDescription } = body;

    const existingArticle = await prisma.article.findUnique({
      where: { slug },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { error: "Статья не найдена" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (excerpt) updateData.excerpt = excerpt;
    if (category) updateData.category = category;
    if (tags) updateData.tags = JSON.stringify(tags);
    if (status) updateData.status = status;
    if (metaTitle) updateData.metaTitle = metaTitle;
    if (metaDescription) updateData.metaDescription = metaDescription;

    const article = await prisma.article.update({
      where: { slug },
      data: updateData,
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
    });
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json(
      { error: "Не удалось обновить статью" },
      { status: 500 }
    );
  }
}

// DELETE /api/articles/[slug] - Удаление статьи
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const existingArticle = await prisma.article.findUnique({
      where: { slug },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { error: "Статья не найдена" },
        { status: 404 }
      );
    }

    await prisma.article.delete({
      where: { slug },
    });

    return NextResponse.json({ message: "Статья удалена" });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json(
      { error: "Не удалось удалить статью" },
      { status: 500 }
    );
  }
}
