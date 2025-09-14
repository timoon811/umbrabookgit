import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

// GET /api/admin/content-projects/[id] - Получить проект по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const project = await prisma.content_projects.findUnique({
      where: { id },
      include: {
        documentationSections: {
          include: {
            pages: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Проект не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Ошибка получения проекта:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/content-projects/[id] - Обновить проект
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { name, description, type, isActive } = body;

    // Проверяем допустимые типы если тип обновляется
    if (type) {
      const allowedTypes = ['documentation', 'courses', 'materials'];
      if (!allowedTypes.includes(type)) {
        return NextResponse.json(
          { error: 'Недопустимый тип проекта' },
          { status: 400 }
        );
      }
    }

    const project = await prisma.content_projects.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Ошибка обновления проекта:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/content-projects/[id] - Удалить проект
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Проверяем существование проекта
    const existingProject = await prisma.content_projects.findUnique({
      where: { id },
      include: {
        documentationSections: true
      }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Проект не найден' },
        { status: 404 }
      );
    }

    // Проверяем, есть ли связанные разделы
    if (existingProject.documentationSections.length > 0) {
      // Вместо удаления, деактивируем проект
      const project = await prisma.content_projects.update({
        where: { id },
        data: { isActive: false }
      });

      return NextResponse.json({
        message: 'Проект деактивирован, так как содержит разделы',
        project
      });
    }

    // Если нет связанных разделов, можно удалить
    await prisma.content_projects.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Проект успешно удален'
    });
  } catch (error) {
    console.error('Ошибка удаления проекта:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
