import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // Публичный API - авторизация не требуется для просмотра опубликованной документации
  try {
    // Получаем все опубликованные документы
    const documentation = await prisma.documentation.findMany({
      where: {
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        sectionId: true,
        order: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { order: 'asc' },
        { sectionId: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Группируем по секциям
    const sections = documentation.reduce((acc, doc) => {
      if (!acc[doc.sectionId]) {
        acc[doc.sectionId] = [];
      }
      acc[doc.sectionId].push(doc);
      return acc;
    }, {} as Record<string, typeof documentation>);

    // Статистика
    const totalDocs = documentation.length;
    const sectionsCount = Object.keys(sections).length;
    const recentDocs = documentation.filter(doc =>
      new Date(doc.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    return NextResponse.json({
      documentation,
      sections,
      statistics: {
        total: totalDocs,
        sections: sectionsCount,
        recent: recentDocs,
      },
    });
  } catch (error: unknown) {
    console.error("Ошибка получения документации:", error);
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}