import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ArticleStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  
  if (!q) return Response.json([]);

  try {
    // Сохраняем поисковый запрос в аналитику
    const userAgent = req.headers.get("user-agent");
    const forwarded = req.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0] : req.headers.get("x-real-ip");
    const sessionId = req.headers.get("x-session-id") || `anon_${Date.now()}_${Math.random()}`;

    // Поиск в базе данных
    const results = await prisma.article.findMany({
      where: {
        status: ArticleStatus.PUBLISHED,
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
          { excerpt: { contains: q } },
        ],
      },
      select: {
        title: true,
        slug: true,
        excerpt: true,
        category: true,
      },
      take: 8,
    });

    const searchResults = results.map(article => ({
      title: article.title,
      url: `/${article.slug}`,
      excerpt: article.excerpt,
      category: article.category,
    }));

    // Сохраняем поисковый запрос
    await Promise.all([
      prisma.searchQuery.create({
        data: {
          query: q,
          results: searchResults.length,
          sessionId,
          ipAddress,
        },
      }).catch(() => {}), // Игнорируем ошибки аналитики
      
      prisma.analytics.create({
        data: {
          event: "search",
          data: JSON.stringify({
            query: q,
            resultsCount: searchResults.length,
          }),
          sessionId,
          userAgent,
          ipAddress,
          referer: req.headers.get("referer"),
        },
      }).catch(() => {}), // Игнорируем ошибки аналитики
    ]);

    return NextResponse.json(searchResults);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
