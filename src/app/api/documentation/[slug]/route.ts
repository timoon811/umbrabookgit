import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// GET /api/documentation/[slug] - Получение страницы документации по slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Проверяем авторизацию - документация требует авторизации
    const authResult = await requireAuth(request);
    
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    
    // ✅ ИСПРАВЛЕНИЕ: Получаем projectId из URL параметров
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    // ✅ КРИТИЧНО: Если projectId не указан, возвращаем ошибку
    if (!projectId) {
      console.log('⚠️ API /documentation/[slug]: ProjectId не указан для slug:', (await params).slug);
      return NextResponse.json({ error: "ProjectId обязателен" }, { status: 400 });
    }

    // ✅ ИСПРАВЛЕНИЕ: Фильтруем страницу только по указанному проекту
    const page = await prisma.documentation.findFirst({
      where: {
        slug: (await params).slug,
        isPublished: true,
        section: {
          projectId: projectId,  // ✅ КРИТИЧНО: Фильтрация по проекту
          isVisible: true
        }
      },
      include: {
        section: {
          select: {
            projectId: true,
            name: true,
            key: true
          }
        }
      }
    });
    
    if (!page) {
      return NextResponse.json({ error: "Страница не найдена" }, { status: 404 });
    }
    
    // ✅ Дополнительная проверка проекта
    if (page.section.projectId !== projectId) {
      console.log(`🚫 API /documentation/[slug]: Страница принадлежит проекту ${page.section.projectId}, а не ${projectId}`);
      return NextResponse.json({ error: "Страница не найдена" }, { status: 404 });
    }
    
    return NextResponse.json({ page });
      
  } catch (error: any) {
    console.error("Ошибка при получении страницы документации:", error);
    return NextResponse.json(
      { error: "Не удалось получить страницу документации" },
      { status: 500 }
    );
  }
}
