import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

// POST /api/admin/documentation/sections - Создать новый раздел документации
export async function POST(request: NextRequest) {
  try {
    

    const authResult = await requireAuth(request);
    
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, key, description, order = 0, projectId } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Название раздела обязательно' },
        { status: 400 }
      );
    }

    if (!key) {
      return NextResponse.json(
        { error: 'Ключ раздела обязателен' },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'ID проекта обязателен' },
        { status: 400 }
      );
    }

    // Проверяем, что проект существует
    const project = await prisma.content_projects.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Проект не найден' },
        { status: 404 }
      );
    }

    // Проверяем уникальность ключа в рамках проекта
    const existingSection = await prisma.documentation_sections.findFirst({
      where: {
        key,
        projectId
      }
    });

    if (existingSection) {
      return NextResponse.json(
        { error: `Раздел с ключом "${key}" уже существует в этом проекте` },
        { status: 400 }
      );
    }

    // Создаем новый раздел
    const section = await prisma.documentation_sections.create({
      data: {
        name,
        key,
        description,
        order,
        projectId,
        isVisible: true
      }
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error('Ошибка создания раздела документации:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// GET /api/admin/documentation/sections - Получить все разделы документации
export async function GET(request: NextRequest) {
  try {
    

    const authResult = await requireAuth(request);
    
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const where: any = {
      isVisible: true
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const sections = await prisma.documentation_sections.findMany({
      where,
      include: {
        pages: {
          where: {
            isPublished: true
          },
          orderBy: [
            { order: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error('Ошибка получения разделов документации:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}