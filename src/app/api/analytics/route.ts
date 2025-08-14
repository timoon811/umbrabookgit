import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/analytics - Отправка события аналитики
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data, userId, sessionId } = body;

    // Валидация
    if (!event) {
      return NextResponse.json(
        { error: "Поле event обязательно" },
        { status: 400 }
      );
    }

    // Получаем метаданные из заголовков
    const userAgent = request.headers.get("user-agent");
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip");
    const referer = request.headers.get("referer");

    const analytics = await prisma.analytics.create({
      data: {
        event,
        data: typeof data === "object" ? JSON.stringify(data) : data,
        userId,
        sessionId,
        userAgent,
        ipAddress,
        referer,
      },
    });

    return NextResponse.json({ success: true, id: analytics.id });
  } catch (error) {
    console.error("Error tracking analytics:", error);
    return NextResponse.json(
      { error: "Не удалось сохранить событие" },
      { status: 500 }
    );
  }
}

// GET /api/analytics - Получение статистики
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const event = searchParams.get("event");
    const days = parseInt(searchParams.get("days") || "7");
    
    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: any = {
      createdAt: { gte: since },
    };

    if (event) where.event = event;

    // Общее количество событий
    const total = await prisma.analytics.count({ where });

    // События по дням
    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM analytics 
      WHERE createdAt >= ${since}
      ${event ? `AND event = ${event}` : ""}
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `;

    // Топ событий
    const topEvents = await prisma.analytics.groupBy({
      by: ["event"],
      where,
      _count: {
        event: true,
      },
      orderBy: {
        _count: {
          event: "desc",
        },
      },
      take: 10,
    });

    // Уникальные пользователи
    const uniqueUsers = await prisma.analytics.findMany({
      where,
      select: {
        userId: true,
        sessionId: true,
        ipAddress: true,
      },
      distinct: ["userId", "sessionId", "ipAddress"],
    });

    return NextResponse.json({
      total,
      uniqueUsers: uniqueUsers.length,
      dailyStats,
      topEvents: topEvents.map(item => ({
        event: item.event,
        count: item._count.event,
      })),
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Не удалось получить статистику" },
      { status: 500 }
    );
  }
}

