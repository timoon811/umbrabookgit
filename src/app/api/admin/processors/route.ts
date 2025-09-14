import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  // Проверяем авторизацию администратора
  const authResult = await requireAdminAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    // Получаем список всех обработчиков
    const processors = await prisma.users.findMany({
      where: { 
        role: "PROCESSOR",
        status: "APPROVED" // Только активные обработчики
      },
      select: { 
        id: true, 
        name: true, 
        email: true,
        telegram: true
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      processors
    });
  } catch (error) {
    console.error('Ошибка получения списка обработчиков:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
