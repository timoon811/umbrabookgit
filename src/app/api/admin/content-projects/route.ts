import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

// GET /api/admin/content-projects - Получить все проекты контента
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

    const projects = await prisma.content_projects.findMany({
      where: {
        isActive: true
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

// POST /api/admin/content-projects - Создать новый проект контента
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
    const { name, description, type } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Название и тип проекта обязательны' },
        { status: 400 }
      );
    }

    // Проверяем допустимые типы
    const allowedTypes = ['documentation', 'courses', 'materials'];
    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Недопустимый тип проекта' },
        { status: 400 }
      );
    }

    const project = await prisma.content_projects.create({
      data: {
        name,
        description,
        type,
        isActive: true
      }
    });

    // Создаем дефолтные разделы для нового проекта
    const defaultSections = [
      {
        name: 'Введение',
        key: `${project.id}-introduction`,
        description: 'Вводная информация',
        order: 1,
        isVisible: true,
        projectId: project.id
      },
      {
        name: 'Основы',
        key: `${project.id}-basics`, 
        description: 'Основные понятия и принципы',
        order: 2,
        isVisible: true,
        projectId: project.id
      },
      {
        name: 'Примеры',
        key: `${project.id}-examples`,
        description: 'Практические примеры',
        order: 3,
        isVisible: true,
        projectId: project.id
      }
    ];

    // Создаем разделы и права доступа в транзакции
    await prisma.$transaction(async (tx) => {
      // Создаем разделы
      for (const section of defaultSections) {
        await tx.documentation_sections.create({
          data: section
        });
      }

      // Создаем дефолтные права доступа (только для ADMIN)
      await tx.project_permissions.create({
        data: {
          projectId: project.id,
          role: 'ADMIN'
        }
      });
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Ошибка создания проекта контента:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
