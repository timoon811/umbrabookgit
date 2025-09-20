import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию - документация теперь требует авторизации
    const authResult = await requireAuth(request);
    
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    
    // ✅ ИСПРАВЛЕНИЕ: Получаем projectId из URL параметров
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    // ✅ КРИТИЧНО: Если projectId не указан, возвращаем пустой результат
    if (!projectId) {
      console.log('⚠️ API /documentation: ProjectId не указан, возвращаем пустую документацию');
      return NextResponse.json({
        documentation: [],
        sections: {},
        statistics: {
          total: 0,
          sections: 0,
          recent: 0,
        },
      });
    }

    // ✅ ИСПРАВЛЕНИЕ: Фильтруем документацию только по указанному проекту
    const documentation = await prisma.documentation.findMany({
      where: {
        isPublished: true,
        section: {
          projectId: projectId,  // ✅ КРИТИЧНО: Фильтрация по проекту
          isVisible: true
        }
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
      
  } catch (error: any) {
    console.error("Ошибка получения документации:", error);
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
