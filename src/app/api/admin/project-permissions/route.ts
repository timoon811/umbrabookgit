import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { getAllRoles } from '@/types/roles';

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

    // Валидация структуры данных
    const validRoles = getAllRoles();
    
    for (const permission of permissions) {
      if (!permission.projectId || typeof permission.projectId !== 'string') {
        return NextResponse.json(
          { error: 'Некорректный ID проекта' },
          { status: 400 }
        );
      }
      
      if (!Array.isArray(permission.allowedRoles)) {
        return NextResponse.json(
          { error: 'Некорректный формат ролей' },
          { status: 400 }
        );
      }
      
      // Проверяем, что все роли валидны
      for (const role of permission.allowedRoles) {
        if (!validRoles.includes(role)) {
          return NextResponse.json(
            { error: `Неизвестная роль: ${role}` },
            { status: 400 }
          );
        }
      }
    }

    // Проверяем, что все проекты существуют
    const projectIds = permissions.map(p => p.projectId);
    const existingProjects = await prisma.content_projects.findMany({
      where: {
        id: { in: projectIds },
        isActive: true
      },
      select: { id: true }
    });
    
    const existingProjectIds = existingProjects.map(p => p.id);
    const missingProjects = projectIds.filter(id => !existingProjectIds.includes(id));
    
    if (missingProjects.length > 0) {
      return NextResponse.json(
        { error: `Проекты не найдены: ${missingProjects.join(', ')}` },
        { status: 404 }
      );
    }

    // Сохраняем права доступа в базе данных
    await prisma.$transaction(async (tx) => {
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
              role: role
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
