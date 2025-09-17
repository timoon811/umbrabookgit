import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";

// Получение списка пользователей
export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию администратора
      const authResult = await requireAdminAuth(request);
      
        if ('error' in authResult) {
        return authResult.error;
      }
    
      
        const { user } = authResult;
    
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "";
        const role = searchParams.get("role") || "";
    
        // Построение условий фильтрации
        const where: any = {};
    
        if (status) {
          where.status = status;
        } else {
          // По умолчанию показываем только одобренных пользователей
          where.status = "APPROVED";
        }
    
        if (role) {
          where.role = role;
        }
    
        // Получение пользователей
        const users = await prisma.users.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            telegram: true,
            role: true,
            status: true,
            isBlocked: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
        });
    
        return NextResponse.json({
          users,
        });
      
  } catch (error: any) {
    console.error("Ошибка получения пользователей:", error);
    return NextResponse.json(
      { message: error.message || "Внутренняя ошибка сервера" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
