import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

// PATCH /api/admin/documentation/[id] - Обновить страницу документации
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
    const { title, description, slug, content, order, isPublished, sectionId } = body;

    // Проверяем, что страница существует
    const existingPage = await prisma.documentation.findUnique({
      where: { id }
    });

    if (!existingPage) {
      return NextResponse.json(
        { error: 'Страница не найдена' },
        { status: 404 }
      );
    }

    // Если изменяется slug, проверяем уникальность
    if (slug && slug !== existingPage.slug) {
      const duplicatePage = await prisma.documentation.findFirst({
        where: {
          slug,
          id: { not: id }
        }
      });

      if (duplicatePage) {
        return NextResponse.json(
          { error: `Страница с URL "${slug}" уже существует` },
          { status: 400 }
        );
      }
    }

    // Если изменяется название в том же разделе, проверяем уникальность
    if (title && title !== existingPage.title) {
      const sectionIdToCheck = sectionId || existingPage.sectionId;
      const duplicateTitle = await prisma.documentation.findFirst({
        where: {
          title,
          sectionId: sectionIdToCheck,
          id: { not: id }
        }
      });

      if (duplicateTitle) {
        return NextResponse.json(
          { error: `Страница с названием "${title}" уже существует в этом разделе` },
          { status: 400 }
        );
      }
    }

    // Если изменяется раздел, проверяем, что новый раздел существует
    if (sectionId && sectionId !== existingPage.sectionId) {
      const section = await prisma.documentation_sections.findUnique({
        where: { id: sectionId }
      });

      if (!section) {
        return NextResponse.json(
          { error: 'Раздел не найден' },
          { status: 404 }
        );
      }
    }

    // Обновляем страницу
    const updatedPage = await prisma.documentation.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(slug !== undefined && { slug }),
        ...(content !== undefined && { content }),
        ...(order !== undefined && { order }),
        ...(isPublished !== undefined && { isPublished }),
        ...(sectionId !== undefined && { sectionId }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedPage);
  } catch (error) {
    console.error('Ошибка обновления страницы документации:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/documentation/[id] - Удалить страницу документации
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

    // Проверяем, что страница существует
    const existingPage = await prisma.documentation.findUnique({
      where: { id }
    });

    if (!existingPage) {
      return NextResponse.json(
        { error: 'Страница не найдена' },
        { status: 404 }
      );
    }

    // Удаляем страницу
    await prisma.documentation.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: 'Страница успешно удалена' 
    });
  } catch (error) {
    console.error('Ошибка удаления страницы документации:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// GET /api/admin/documentation/[id] - Получить страницу документации по ID
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

    const page = await prisma.documentation.findUnique({
      where: { id },
      include: {
        section: {
          select: {
            id: true,
            name: true,
            key: true,
            description: true
          }
        }
      }
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Страница не найдена' },
        { status: 404 }
      );
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error('Ошибка получения страницы документации:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}