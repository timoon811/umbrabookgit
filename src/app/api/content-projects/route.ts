import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

// GET /api/content-projects - Получить все активные проекты контента для обычных пользователей
export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию пользователя
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    // Получаем только активные проекты, доступные всем авторизованным пользователям
    const projects = await prisma.content_projects.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        isActive: true,
        documentationSections: {
          where: {
            isVisible: true
          },
          select: {
            id: true,
            pages: {
              where: {
                isPublished: true
              },
              select: {
                slug: true,
                title: true
              },
              orderBy: [
                { order: 'asc' },
                { createdAt: 'asc' }
              ],
              take: 1
            }
          },
          orderBy: [
            { order: 'asc' },
            { createdAt: 'asc' }
          ],
          take: 1
        }
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Ошибка получения проектов контента:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
