import { checkAdminAuthUserId } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from '@/lib/api-auth';

// GET /api/admin/finance/projects - Получение списка проектов
export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const archiveStatus = searchParams.get('archiveStatus');
    
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (archiveStatus) {
      where.isArchived = archiveStatus === 'archived';
    }
    
    const projects = await prisma.finance_projects.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error("Ошибка при получении проектов:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить проекты" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// POST /api/admin/finance/projects - Создание нового проекта
export async function POST(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();
    
    const body = await request.json();
    const { name, description, status, isArchived = false } = body;

    if (!name) {
      return NextResponse.json({ error: "Название проекта обязательно" }, { status: 400 });
    }

    const project = await prisma.finance_projects.create({
      data: {
        name,
        description,
        status: status || "ACTIVE",
        isArchived,
      }
    });
    
    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error("Ошибка при создании проекта:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось создать проект" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
