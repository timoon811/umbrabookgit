import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

// POST /api/admin/project-permissions - Сохранить права доступа для проектов
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
    const { permissions } = body;

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Некорректный формат данных' },
        { status: 400 }
      );
    }

    // Сохраняем права доступа в базе данных
    await prisma.$transaction(async (tx) => {
      // Получаем все проекты для которых нужно установить права
      const projectIds = permissions.map(p => p.projectId);
      
      // Удаляем старые права для этих проектов
      await tx.project_permissions.deleteMany({
        where: {
          projectId: {
            in: projectIds
          }
        }
      });
      
      // Создаем новые права
      for (const permission of permissions) {
        for (const role of permission.allowedRoles) {
          await tx.project_permissions.create({
            data: {
              projectId: permission.projectId,
              role: role as any
            }
          });
        }
      }
    });

    return NextResponse.json({ 
      message: 'Права доступа успешно сохранены',
      savedPermissions: permissions 
    });
  } catch (error) {
    console.error('Ошибка сохранения прав доступа:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// GET /api/admin/project-permissions - Получить права доступа для проектов
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

    // Получаем все проекты с их правами доступа
    const projects = await prisma.content_projects.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        permissions: {
          select: {
            role: true
          }
        }
      }
    });

    // Формируем права доступа из базы данных
    const permissions = projects.map(project => ({
      projectId: project.id,
      projectName: project.name,
      allowedRoles: project.permissions.length > 0 
        ? project.permissions.map(p => p.role)
        : ['ADMIN'] // По умолчанию только админы для новых проектов
    }));

    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Ошибка получения прав доступа:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
