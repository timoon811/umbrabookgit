import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

// PATCH /api/admin/documentation/sections/[id] - Обновить раздел документации
export async function PATCH(
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
    const { name, key, description, order, isVisible } = body;

    // Проверяем, что раздел существует
    const existingSection = await prisma.documentation_sections.findUnique({
      where: { id }
    });

    if (!existingSection) {
      return NextResponse.json(
        { error: 'Раздел не найден' },
        { status: 404 }
      );
    }

    // Если изменяется ключ, проверяем уникальность в рамках проекта
    if (key && key !== existingSection.key) {
      const duplicateSection = await prisma.documentation_sections.findFirst({
        where: {
          key,
          projectId: existingSection.projectId,
          id: { not: id }
        }
      });

      if (duplicateSection) {
        return NextResponse.json(
          { error: `Раздел с ключом "${key}" уже существует в этом проекте` },
          { status: 400 }
        );
      }
    }

    // Обновляем раздел
    const updatedSection = await prisma.documentation_sections.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(key !== undefined && { key }),
        ...(description !== undefined && { description }),
        ...(order !== undefined && { order }),
        ...(isVisible !== undefined && { isVisible }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedSection);
  } catch (error) {
    console.error('Ошибка обновления раздела документации:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/documentation/sections/[id] - Удалить раздел документации
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

    // Проверяем, что раздел существует
    const existingSection = await prisma.documentation_sections.findUnique({
      where: { id },
      include: {
        pages: true
      }
    });

    if (!existingSection) {
      return NextResponse.json(
        { error: 'Раздел не найден' },
        { status: 404 }
      );
    }

    // Проверяем, что в разделе нет страниц
    if (existingSection.pages.length > 0) {
      return NextResponse.json(
        { error: 'Нельзя удалить раздел, в котором есть страницы. Сначала удалите все страницы.' },
        { status: 400 }
      );
    }

    // Удаляем раздел
    await prisma.documentation_sections.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: 'Раздел успешно удален' 
    });
  } catch (error) {
    console.error('Ошибка удаления раздела документации:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// GET /api/admin/documentation/sections/[id] - Получить раздел документации по ID
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

    const section = await prisma.documentation_sections.findUnique({
      where: { id },
      include: {
        pages: {
          orderBy: [
            { order: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });

    if (!section) {
      return NextResponse.json(
        { error: 'Раздел не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(section);
  } catch (error) {
    console.error('Ошибка получения раздела документации:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}