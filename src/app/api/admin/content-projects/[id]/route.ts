import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

// PUT /api/admin/content-projects/[id] - Обновить проект контента
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const body = await request.json();
    const { name, description, type, isActive } = body;

    // Проверяем, что проект существует
    const existingProject = await prisma.content_projects.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Проект не найден' },
        { status: 404 }
      );
    }

    // Валидация типа, если он изменяется
    if (type) {
      const allowedTypes = ['documentation', 'courses', 'materials'];
      if (!allowedTypes.includes(type)) {
        return NextResponse.json(
          { error: 'Недопустимый тип проекта' },
          { status: 400 }
        );
      }
    }

    // Обновляем проект
    const updatedProject = await prisma.content_projects.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Ошибка обновления проекта контента:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/content-projects/[id] - Удалить проект контента
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Проверяем, что проект существует
    const existingProject = await prisma.content_projects.findUnique({
      where: { id },
      include: {
        documentationSections: {
          include: {
            pages: true
          }
        }
      }
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Проект не найден' },
        { status: 404 }
      );
    }

    // Используем транзакцию для безопасного удаления
    await prisma.$transaction(async (tx) => {
      // Удаляем все страницы
      for (const section of existingProject.documentationSections) {
        await tx.documentation.deleteMany({
          where: { sectionId: section.id }
        });
      }

      // Удаляем все разделы
      await tx.documentation_sections.deleteMany({
        where: { projectId: id }
      });

      // Удаляем сам проект
      await tx.content_projects.delete({
        where: { id }
      });
    });

    return NextResponse.json({ 
      message: 'Проект и все связанные данные успешно удалены' 
    });
  } catch (error) {
    console.error('Ошибка удаления проекта контента:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// GET /api/admin/content-projects/[id] - Получить проект контента по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const project = await prisma.content_projects.findUnique({
      where: { id },
      include: {
        documentationSections: {
          where: {
            isVisible: true
          },
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
    console.error('Ошибка получения проекта контента:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}