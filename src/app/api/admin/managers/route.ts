import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { requireAdminAuth } from '@/lib/api-auth';

// GET /api/admin/managers - Получение списка менеджеров
export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await requireAdmin(request);

    // Получаем всех пользователей с ролью PROCESSOR
    const managers = await prisma.users.findMany({
      where: {
        role: "PROCESSOR",
        status: "APPROVED"
      },
      select: {
        id: true,
        name: true,
        email: true,
        telegram: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      managers,
      count: managers.length
    });
  } catch (error: any) {
    console.error("Ошибка получения менеджеров:", error);
    return NextResponse.json(
      { error: error.message || "Внутренняя ошибка сервера" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
