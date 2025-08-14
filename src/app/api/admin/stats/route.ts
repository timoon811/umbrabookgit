import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/stats - Получение общей статистики для админ панели
export async function GET(request: NextRequest) {
  try {
    // Общие счетчики
    const [
      totalArticles,
      publishedArticles,
      totalUsers,
      totalComments,
      totalFeedback,
      totalViews,
    ] = await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { status: "PUBLISHED" } }),
      prisma.user.count(),
      prisma.comment.count(),
      prisma.feedback.count(),
      prisma.article.aggregate({
        _sum: { viewCount: true },
      }),
    ]);

    // Статистика за последние 7 дней
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      newArticlesThisWeek,
      newUsersThisWeek,
      searchQueriesThisWeek,
      feedbackThisWeek,
    ] = await Promise.all([
      prisma.article.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.searchQuery.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.feedback.count({
        where: { createdAt: { gte: weekAgo } },
      }),
    ]);

    // Топ поисковых запросов
    const topSearchQueries = await prisma.searchQuery.groupBy({
      by: ["query"],
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 10,
      where: { createdAt: { gte: weekAgo } },
    });

    // Популярные статьи
    const popularArticles = await prisma.article.findMany({
      select: {
        title: true,
        slug: true,
        viewCount: true,
        category: true,
      },
      orderBy: { viewCount: "desc" },
      take: 10,
      where: { status: "PUBLISHED" },
    });

    // Распределение обратной связи
    const feedbackDistribution = await prisma.feedback.groupBy({
      by: ["type"],
      _count: { type: true },
      where: { createdAt: { gte: weekAgo } },
    });

    // Активность по дням
    const dailyActivity = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as articleViews
      FROM analytics 
      WHERE event = 'page_view' 
        AND createdAt >= ${weekAgo}
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
      LIMIT 7
    `;

    return NextResponse.json({
      overview: {
        totalArticles,
        publishedArticles,
        totalUsers,
        totalComments,
        totalFeedback,
        totalViews: totalViews._sum.viewCount || 0,
      },
      thisWeek: {
        newArticles: newArticlesThisWeek,
        newUsers: newUsersThisWeek,
        searchQueries: searchQueriesThisWeek,
        feedback: feedbackThisWeek,
      },
      topSearchQueries: topSearchQueries.map(item => ({
        query: item.query,
        count: item._count.query,
      })),
      popularArticles,
      feedbackDistribution: feedbackDistribution.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>),
      dailyActivity,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Не удалось получить статистику" },
      { status: 500 }
    );
  }
}

