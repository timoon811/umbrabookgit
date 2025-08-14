import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractHeadingsForToc } from "@/lib/docs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
  }

  try {
    // Получаем статью из базы данных
    const article = await prisma.article.findFirst({
      where: {
        slug: slug,
        status: "PUBLISHED",
      },
      select: { 
        content: true,
        title: true 
      },
    });

    if (!article) {
      return NextResponse.json({ items: [] });
    }

    // Извлекаем заголовки для TOC
    const items = extractHeadingsForToc(article.content);
    
    return NextResponse.json({ 
      items,
      articleTitle: article.title 
    });

  } catch (error) {
    console.error("Error loading TOC:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
