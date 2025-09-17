import { checkAdminAuthUserId } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from '@/lib/api-auth';

// GET /api/admin/finance/categories - Получение списка категорий
export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    
    const where: any = {};
    
    if (type) {
      where.type = type;
    }
    
    if (status) {
      where.isArchived = status === 'archived';
    }
    
    const categories = await prisma.finance_categories.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        color: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error("Ошибка при получении категорий:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить категории" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// POST /api/admin/finance/categories - Создание новой категории
export async function POST(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();
    
    const body = await request.json();
    const { name, type, description, color, isArchived = false } = body;
    
    if (!name) {
      return NextResponse.json({ error: "Название категории обязательно" }, { status: 400 });
    }
    
    const category = await prisma.finance_categories.create({
      data: {
        name,
        type: type || "EXPENSE",
        description,
        color: color || "#3B82F6",
        isArchived,
      }
    });
    
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("Ошибка при создании категории:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось создать категорию" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
